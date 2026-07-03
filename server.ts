import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Smart Financial Insights via Gemini
  app.post("/api/gemini/think", async (req, res) => {
    const { categories, transactions, incomeSources, customQuestion } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Settings > Secrets panel of your AI Studio environment.",
      });
    }

    try {
      // Lazy initialization of the GoogleGenAI client with the required telemetry header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Construct a highly structured, analytical prompt for Gemini
      const systemInstruction = `You are VibeBudget's senior AI financial accountant and zero-based budgeting analyst.
Analyze the user's financial log data and provide high-fidelity, actionable "smart statistics," anomaly reports, savings leakage opportunities, and strategic advice.
Adhere to these rules:
1. Frame advice within the "Zero-Based Budgeting" methodology (every single dollar of income must have a job).
2. Calculate precise financial percentages, savings rates, and burn velocity.
3. Be professional, highly analytical, objective, and scannable. Use clear markdown headers, bold key figures, and clean bullet points.
4. Keep the summary highly focused on actual numbers provided. Do not invent simulated transactions. If some data is empty, mention that fact analytically.
5. Provide a "Smart Statistics Summary" table or bullet point block summarizing key health metrics.
6. Provide a "Zero-Based Audit Check" to see if budgeted totals equal total income, and advise on allocations.`;

      const userPrompt = `Here is the current month's budget state:
- ACTIVE CATEGORIES & ALLOCATED BUDGETS:
${JSON.stringify(categories, null, 2)}

- ACTIVE MONTHLY LEDGER TRANSACTIONS:
${JSON.stringify(transactions, null, 2)}

- ACTIVE INCOME SOURCES:
${JSON.stringify(incomeSources, null, 2)}

USER QUESTION / FOCUS REQUEST:
"${customQuestion || "Generate a comprehensive smart statistics report, zero-based alignment audit, and identify key spending leaks or saving opportunities."}"`;

      // Call the correct, modern Gemini 3.5 model
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2, // low temperature for precise, deterministic math and stats
        },
      });

      const text = response.text;
      return res.json({ result: text });

    } catch (err: any) {
      console.error("Gemini API error:", err);
      return res.status(500).json({
        error: "An error occurred while connecting to Gemini: " + (err.message || err),
      });
    }
  });

  // API Route: Smart Categorization & Natural Language Parsing via Gemini
  app.post("/api/gemini/categorize", async (req, res) => {
    const { naturalInput, categories } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Settings > Secrets panel of your AI Studio environment.",
      });
    }

    if (!naturalInput || !naturalInput.trim()) {
      return res.status(400).json({ error: "No input text provided." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const categoriesList = categories && Array.isArray(categories) 
        ? categories.map((c: any) => c.name) 
        : ["Food & Dining", "Shopping", "Groceries", "Gym & Fitness", "Subscriptions", "Utilities", "Gas & Transportation", "Car Insurance", "Rent & Housing", "Savings"];

      const systemInstruction = `You are VibeBudget's senior zero-based budgeting AI parser.
Analyze the user's natural language spending input and extract structured financial fields.
Your objective:
1. Extract "amount": Look for any numbers representing spending (e.g., "52", "$12.50", "Spent 15"). Express this as a float number (0 if not found).
2. Extract "merchant": Clean, capitalized, reader-friendly merchant or transaction description (e.g., "TJMaxx", "Starbucks", "Spotify").
3. Determine "category": Map the transaction to the single best-fitting category from the available list of categories provided.

Available categories list:
${categoriesList.map((cat: string) => `- ${cat}`).join("\n")}

If the transaction description is ambiguous, choose the category that fits best based on typical spending.
If there's absolutely no relevance to any category, select "Uncategorized" or a generic one like "Shopping".

You MUST respond with a single JSON object fitting this schema:
{
  "amount": number,
  "merchant": "string",
  "category": "string",
  "reasoning": "string"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Input transaction text: "${naturalInput}"`,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response returned from the AI model.");
      }

      const resultObj = JSON.parse(text.trim());
      return res.json(resultObj);

    } catch (err: any) {
      console.error("Gemini Categorization error:", err);
      return res.status(500).json({
        error: "An error occurred while categorizing with Gemini: " + (err.message || err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
