import { BudgetCategory } from '../types';

// Static seed dictionary mapping merchant keywords to standard categories
export const STATIC_MAPPING: Record<string, string> = {
  starbucks: "Food & Dining",
  mcdonalds: "Food & Dining",
  chipotle: "Food & Dining",
  "planet fitness": "Gym & Fitness",
  "gold's gym": "Gym & Fitness",
  "liberty mutual": "Car Insurance",
  geico: "Car Insurance",
  statefarm: "Car Insurance",
  tjmax: "Shopping",
  tjmaxx: "Shopping",
  shoes: "Shopping",
  amazon: "Shopping",
  walmart: "Groceries",
  target: "Groceries",
  kroger: "Groceries",
  safeway: "Groceries",
  netflix: "Subscriptions",
  spotify: "Subscriptions",
  hulu: "Subscriptions",
  rent: "Rent & Housing",
  landlord: "Rent & Housing",
  comcast: "Utilities",
  chevron: "Gas & Transportation",
  shell: "Gas & Transportation",
  exxon: "Gas & Transportation",
  uber: "Gas & Transportation",
  lyft: "Gas & Transportation",
};

/**
 * Parses a single-line natural language text into a structured amount and merchant.
 * Example: "$52 for tjmax shopping shoes"
 * Example: "$12.50 Starbucks"
 * Example: "Starbucks $4.25"
 * Example: "Spent 15 on spotify"
 */
export function parseNaturalLanguageInput(input: string): {
  amount: number;
  merchant: string;
  suggestedCategory: string;
} {
  const trimmed = input.trim();
  let amount = 0;
  let merchant = "";

  // 1. Try to extract amount. Look for dollar signs followed by a number, or just floating point numbers.
  const amountRegex = /(?:\$)?(\d+(?:\.\d{2})?)/g;
  let match: RegExpExecArray | null;
  const matches: { value: number; raw: string; index: number }[] = [];

  while ((match = amountRegex.exec(trimmed)) !== null) {
    const val = parseFloat(match[1]);
    if (!isNaN(val)) {
      matches.push({ value: val, raw: match[0], index: match.index });
    }
  }

  // Choose the best match (often the one with a dollar sign prefix or just the largest/first)
  let bestMatch = matches.find((m) => m.raw.startsWith("$"));
  if (!bestMatch && matches.length > 0) {
    bestMatch = matches[0];
  }

  if (bestMatch) {
    amount = bestMatch.value;
  }

  // 2. Clean up merchant string
  if (bestMatch) {
    // Remove the amount from the string
    const beforeAmount = trimmed.substring(0, bestMatch.index);
    const afterAmount = trimmed.substring(bestMatch.index + bestMatch.raw.length);
    merchant = `${beforeAmount} ${afterAmount}`;
  } else {
    merchant = trimmed;
  }

  // Clean common trigger words
  merchant = merchant
    .replace(/\b(for|at|on|from|spent|bought|at|to|in|a|an)\b/gi, " ")
    .replace(/[^a-zA-Z0-9\s'&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If no merchant is left, make it default
  if (!merchant) {
    merchant = "Unspecified Expense";
  }

  // 3. Smart Categorize
  const suggestedCategory = smartCategorize(merchant, {});

  return {
    amount,
    merchant,
    suggestedCategory,
  };
}

/**
 * Match merchant against static mapping and learned mapping.
 */
export function smartCategorize(
  merchant: string,
  learnedMappings: Record<string, string>
): string {
  const normalized = merchant.toLowerCase().trim();

  // Check learned mappings first (user's explicit overrides)
  for (const key of Object.keys(learnedMappings)) {
    if (normalized.includes(key.toLowerCase())) {
      return learnedMappings[key];
    }
  }

  // Check static seed mappings
  for (const key of Object.keys(STATIC_MAPPING)) {
    if (normalized.includes(key.toLowerCase())) {
      return STATIC_MAPPING[key];
    }
  }

  // Simple keyword fallbacks
  if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("workout")) {
    return "Gym & Fitness";
  }
  if (normalized.includes("insurance") || normalized.includes("car") || normalized.includes("auto")) {
    return "Car Insurance";
  }
  if (normalized.includes("shop") || normalized.includes("store") || normalized.includes("mall")) {
    return "Shopping";
  }
  if (normalized.includes("grocery") || normalized.includes("groceries") || normalized.includes("market") || normalized.includes("food")) {
    return "Groceries";
  }
  if (normalized.includes("cafe") || normalized.includes("coffee") || normalized.includes("restaurant") || normalized.includes("diner") || normalized.includes("bistro")) {
    return "Food & Dining";
  }
  if (normalized.includes("sub") || normalized.includes("music") || normalized.includes("tv") || normalized.includes("stream")) {
    return "Subscriptions";
  }
  if (normalized.includes("gas") || normalized.includes("fuel") || normalized.includes("station") || normalized.includes("transit")) {
    return "Gas & Transportation";
  }
  if (normalized.includes("electric") || normalized.includes("water") || normalized.includes("power") || normalized.includes("internet") || normalized.includes("phone")) {
    return "Utilities";
  }

  return "Uncategorized";
}

/**
 * Parses Chat Log Conversations (from Claude, ChatGPT, etc.)
 * Searches for JSON blocks, Key-Value pairs, or specific lines like '"merchant" -> "category"'
 * and merges them safely.
 */
export function parseChatLogContext(chatText: string): Record<string, string> {
  const learned: Record<string, string> = {};

  // 1. Try to extract JSON blocks
  const jsonRegex = /({[\s\S]*?})/g;
  let jsonMatch;
  while ((jsonMatch = jsonRegex.exec(chatText)) !== null) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof k === 'string' && typeof v === 'string') {
            learned[k.trim()] = v.trim();
          }
        }
      }
    } catch (e) {
      // Not valid JSON block, skip or continue
    }
  }

  // 2. Scan line-by-line for mapping formats:
  // "merchant" -> "category"
  // "merchant": "category"
  // merchant = category
  // merchant: category
  const lines = chatText.split("\n");
  const arrowRegex = /["']?([^"'\-=>:\n]+)["']?\s*(?:->|=>|:|=)\s*["']?([^"'\n]+)["']?/i;

  for (const line of lines) {
    // skip code block backticks lines
    if (line.trim().startsWith("```")) continue;
    
    const match = line.match(arrowRegex);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      
      // Filter out typical false positives
      if (
        key && val &&
        key.length > 2 && key.length < 50 &&
        val.length > 2 && val.length < 50 &&
        !key.includes("{") && !key.includes("}") &&
        !val.includes("{") && !val.includes("}")
      ) {
        // Only accept if key doesn't look like code syntax
        const badKeywords = ["let", "const", "function", "var", "import", "export", "type", "interface", "class"];
        if (!badKeywords.some(w => key.toLowerCase().startsWith(w + " "))) {
          learned[key] = val;
        }
      }
    }
  }

  return learned;
}
