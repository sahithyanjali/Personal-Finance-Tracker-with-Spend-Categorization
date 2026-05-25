import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy initialize Gemini client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found or default placeholder detected. Using heuristic fallback model.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    aiEnabled: !!ai,
    message: ai ? "AI services fully active!" : "Running in heuristic simulation mode (add GEMINI_API_KEY in Secrets for Gemini AI parsing)."
  });
});

// AI Endpoint: Parse unstructured text (SMS alerts, UPI messages, manual shorthand receipt input)
app.post("/api/parse-input", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Text field is required" });
    return;
  }

  // 1. If Gemini AI is enabled, run the model
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this personal finance transaction alert or note: "${text}".
Today's date is 2026-05-25. If the year is ambiguous, assume 2026.
Extract and structure the transaction information precisely in the required format. Ensure the category is one of our standard categories, amount is positive, and dates are in YYYY-MM-DD.`,
        config: {
          systemInstruction: "You are an automated fintech engine that parses bank SMS alerts, UPI notifications, and user shorthand transaction notes. Standard categories are: Food & Dining, Utilities, Entertainment, Subscriptions, Shopping, Travel, Health & Fitness, Housing, Other.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER, description: "The numeric amount debited or credited. Default to 0 if not extractable." },
              merchant: { type: Type.STRING, description: "A clean, natural merchant or recipient name (e.g. 'Starbucks' instead of 'STARBUCKS*COFFEES_7392')." },
              category: { type: Type.STRING, description: "The most fitting category: 'Food & Dining', 'Utilities', 'Entertainment', 'Subscriptions', 'Shopping', 'Travel', 'Health & Fitness', 'Housing', 'Other'." },
              paymentMethod: { type: Type.STRING, description: "Must be exactly one of: 'UPI', 'Credit Card', 'Cash', 'Debit Card', 'Bank Transfer'. Default to 'UPI'." },
              date: { type: Type.STRING, description: "Transaction date formatted as YYYY-MM-DD. If unspecified, default to '2026-05-25'." },
              description: { type: Type.STRING, description: "A concise description outlining what the transaction represents (e.g. 'Coffee purchase at Starbucks')." }
            },
            required: ["amount", "merchant", "category", "paymentMethod", "date", "description"]
          }
        }
      });

      const jsonText = response.text?.trim() || "{}";
      const parsedData = JSON.parse(jsonText);
      res.json({ source: "gemini", data: parsedData });
      return;
    } catch (err: any) {
      console.error("Gemini parse failed, falling back to heuristics:", err);
    }
  }

  // 2. Local fallback heuristic parsing rules (Regex)
  const data = heuristicParse(text);
  res.json({ source: "simulation", data });
});

// AI Endpoint: Generate personalized financial insights & health score based on user state
app.post("/api/generate-insights", async (req: Request, res: Response) => {
  const { transactions, budgets, goals, subscriptions } = req.body;

  // Pre-process state to summarize for AI to stay within token limits
  const summary = {
    totalTransactionsCount: transactions?.length || 0,
    recentTransactions: (transactions || []).slice(0, 10).map((t: any) => ({
      amount: t.amount,
      merchant: t.merchant,
      category: t.category,
      date: t.date,
      isRecurring: t.isRecurring,
      status: t.status
    })),
    budgets: budgets || [],
    goals: goals || [],
    subscriptions: subscriptions || []
  };

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this user's financial profile and recent transaction habits:
${JSON.stringify(summary, null, 2)}

Provide detailed financial recommendations, budget warnings, subscription savings opportunities, and award an overall Financial Health Score (0-100) and letter grade (A+ through F) based on their savings habits, budget overflows, and high subscription burdens.
Return the analysis strictly in JSON format matching the schema rules.`,
        config: {
          systemInstruction: "You are a proactive, highly professional personal wealth advisor. Provide practical, accurate financial recommendations. Look for: over-budget categories, unnecessary subscriptions, low progress on saving goals, and anomalous transaction amounts.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.NUMBER, description: "A realistic financial health score from 0 to 100 based on budget adherence and savings." },
              healthGrade: { type: Type.STRING, description: "The equivalent letter grade: 'A+', 'A', 'B', 'C', 'D', or 'F'." },
              healthMessage: { type: Type.STRING, description: "A high-level summary paragraph of their current state and primary area of improvement." },
              healthFactors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "E.g. 'Budget Disipline', 'Savings Progress', 'Subscription burden', or 'Fixed Expenses Control'" },
                    score: { type: Type.NUMBER, description: "Metric score from 0 to 100" },
                    status: { type: Type.STRING, description: "'good', 'moderate', or 'poor'" }
                  },
                  required: ["name", "score", "status"]
                }
              },
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Unique short alphanumeric ID (e.g. 'ins_1')" },
                    type: { type: Type.STRING, description: "'warning', 'tip', 'success', or 'info'" },
                    title: { type: Type.STRING, description: "Actionable, bold title of the recommendation" },
                    description: { type: Type.STRING, description: "Elaborated tip on how to save money or fix the budget issue." }
                  },
                  required: ["id", "type", "title", "description"]
                }
              }
            },
            required: ["healthScore", "healthGrade", "healthMessage", "healthFactors", "insights"]
          }
        }
      });

      const jsonText = response.text?.trim() || "{}";
      const insightsData = JSON.parse(jsonText);
      res.json({ source: "gemini", data: insightsData });
      return;
    } catch (err: any) {
      console.error("Gemini insights generator failed, falling back to heuristics:", err);
    }
  }

  // Local fallback heuristics for Insights
  const report = generateSimulatedInsights(transactions || [], budgets || [], goals || [], subscriptions || []);
  res.json({ source: "simulation", data: report });
});

// Heuristic fallback text parser when Gemini is unavailable
function heuristicParse(text: string) {
  const clean = text.toLowerCase();
  let amount = 0;
  let merchant = "Unknown Merchant";
  let category = "Other";
  let paymentMethod: 'UPI' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Bank Transfer' = "UPI";
  const date = "2026-05-25";
  let description = "Automatically parsed transaction details";

  // Regex for amounts (e.g. "INR 500", "Rs. 250", "450$", "$12.50")
  const amtMatch = text.match(/(?:inr|rs\.?|usd|\$)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs|usd|\$)/i);
  if (amtMatch) {
    amount = parseFloat((amtMatch[1] || amtMatch[2]).replace(/,/g, ""));
  } else {
    // Look for any decimal or standalone number
    const genericNum = text.match(/\b\d+(\.\d{1,2})?\b/);
    if (genericNum) amount = parseFloat(genericNum[0]);
  }

  // Payment methods detection
  if (clean.includes("upi") || clean.includes("gpay") || clean.includes("phonepe") || clean.includes("paytm")) {
    paymentMethod = "UPI";
  } else if (clean.includes("card") || clean.includes("credit") || clean.includes("swipe")) {
    paymentMethod = "Credit Card";
  } else if (clean.includes("cash") || clean.includes("hand")) {
    paymentMethod = "Cash";
  } else if (clean.includes("debit") || clean.includes("atm")) {
    paymentMethod = "Debit Card";
  } else if (clean.includes("transfer") || clean.includes("bank") || clean.includes("neft") || clean.includes("rtgs")) {
    paymentMethod = "Bank Transfer";
  }

  // Category and Merchant guessing
  if (clean.includes("starbucks") || clean.includes("coffee") || clean.includes("mcdonald") || clean.includes("food") || clean.includes("restaurant") || clean.includes("uber eats") || clean.includes("swiggy") || clean.includes("zomato") || clean.includes("cafe")) {
    category = "Food & Dining";
    merchant = text.match(/starbucks|mcdonald|uber eats|swiggy|zomato/gi)?.[0] || "Local Cafe";
    description = `Food order at ${merchant}`;
  } else if (clean.includes("netflix") || clean.includes("spotify") || clean.includes("youtube") || clean.includes("prime") || clean.includes("hulu") || clean.includes("disney")) {
    category = "Subscriptions";
    merchant = text.match(/netflix|spotify|youtube|prime|hulu|disney/gi)?.[0] || "Streaming Service";
    description = `${merchant} monthly premium subscription`;
  } else if (clean.includes("electric") || clean.includes("power") || clean.includes("water") || clean.includes("gas") || clean.includes("internet") || clean.includes("wifi") || clean.includes("bill")) {
    category = "Utilities";
    merchant = "Utility Provider";
    description = "Utility bill payment";
  } else if (clean.includes("amazon") || clean.includes("flipkart") || clean.includes("walmart") || clean.includes("mall") || clean.includes("grocery") || clean.includes("store") || clean.includes("shirt") || clean.includes("clothing")) {
    category = "Shopping";
    merchant = text.match(/amazon|flipkart|walmart/gi)?.[0] || "Retail Store";
    description = `Shopping purchase at ${merchant}`;
  } else if (clean.includes("uber") || clean.includes("lyft") || clean.includes("taxi") || clean.includes("flight") || clean.includes("airline") || clean.includes("train") || clean.includes("railway") || clean.includes("petrol") || clean.includes("fuel")) {
    category = "Travel";
    merchant = text.match(/uber|lyft|flight|petrol|shell/gi)?.[0] || "Travel / Transport";
    description = `Travel expense for ${merchant}`;
  } else if (clean.includes("movie") || clean.includes("cinema") || clean.includes("fun") || clean.includes("game") || clean.includes("ticket") || clean.includes("concert")) {
    category = "Entertainment";
    merchant = "Cinema/Entertainment Center";
    description = "Entertainment leisure outing";
  } else if (clean.includes("doctor") || clean.includes("hospital") || clean.includes("clinic") || clean.includes("pharma") || clean.includes("medicine") || clean.includes("gym") || clean.includes("fitness")) {
    category = "Health & Fitness";
    merchant = "Medical/Fitness Provider";
    description = "Health & Fitness spent";
  } else if (clean.includes("rent") || clean.includes("landlord") || clean.includes("house") || clean.includes("flat") || clean.includes("maintenance")) {
    category = "Housing";
    merchant = "Property Owner";
    description = "Housing rent / maintenance";
  } else {
    // Default fallback
    const words = text.trim().split(/\s+/);
    merchant = words.slice(0, 3).join(" ") || "Unknown Merchant";
    description = `Parsed manual detail: "${text}"`;
  }

  return { amount, merchant, category, paymentMethod, date, description };
}

// Heuristic fallback insights generator when Gemini is offline
function generateSimulatedInsights(transactions: any[], budgets: any[], goals: any[], subscriptions: any[]) {
  const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0);
  
  // Calculate category totals
  const categorySpent: Record<string, number> = {};
  transactions.forEach(t => {
    categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
  });

  const insights = [];
  const healthFactors = [];
  let budgetOverruns = 0;

  // Let's inspect category budgets
  budgets.forEach((b: any) => {
    const spent = categorySpent[b.category] || 0;
    const ratio = b.limit > 0 ? spent / b.limit : 0;
    
    if (ratio > 1.0) {
      budgetOverruns++;
      insights.push({
        id: `ins_over_${b.category}`,
        type: 'warning' as const,
        title: `${b.category} Budget Exploded!`,
        description: `You have spent ${Math.round(ratio * 100)}% of your assigned budget of $${b.limit} on ${b.category}. Try to cut down unnecessary items.`
      });
    } else if (ratio > 0.8) {
      insights.push({
        id: `ins_near_${b.category}`,
        type: 'info' as const,
        title: `Approaching ${b.category} Budget Limit`,
        description: `You are at ${Math.round(ratio * 100)}% of your $${b.limit} target. Plan remaining days carefully.`
      });
    }
  });

  // Goal alerts
  goals.forEach((g: any) => {
    const ratio = g.target > 0 ? g.current / g.target : 0;
    if (ratio < 0.2) {
      insights.push({
        id: `ins_goal_${g.id}`,
        type: 'tip' as const,
        title: `Boost "${g.name}" Goal Progress`,
        description: `You're currently at only ${Math.round(ratio * 100)}% towards your $${g.target} goal. Auto-deposit minor sums of $10 to pick up the speed.`
      });
    }
  });

  // Calculate Subscription Burden
  const subscriptionCost = subscriptions
    .filter(s => s.status !== 'cancelled_recommended')
    .reduce((acc, s) => acc + s.cost, 0);

  if (subscriptionCost > 100) {
    insights.push({
      id: `ins_sub_burden`,
      type: 'warning' as const,
      title: `High Subscription Overhead Detected`,
      description: `Subscriptions cost you $${subscriptionCost} monthly. Deleting just one unused streaming bundle or gym pass can save you up to $250 annually.`
    });
  }

  // Base general suggestions
  if (insights.length === 0) {
    insights.push({
      id: "ins_general_ok",
      type: 'success' as const,
      title: "Finances Under Smooth Control",
      description: "You are within limits across all categories and making stable headway on objectives. Keep it up!"
    });
  }

  // Calculate generic health score
  let score = 85;
  score -= budgetOverruns * 12;
  score -= (subscriptionCost > 150) ? 10 : 0;
  if (goals.length > 0) {
    const totalGoalRatio = goals.reduce((acc, g) => acc + (g.current / g.target), 0) / goals.length;
    score += Math.round(totalGoalRatio * 8);
  }
  score = Math.max(20, Math.min(100, score));

  let grade = "B+";
  let statusMessage = "Your digital wallet is in high health. Keep tracking diligently!";
  if (score >= 95) { grade = "A+"; statusMessage = "Exceptional financial governance! Maximum wellness grade achieved."; }
  else if (score >= 90) { grade = "A"; statusMessage = "Outstanding savings patterns and immaculate budget tracking!"; }
  else if (score >= 80) { grade = "B"; statusMessage = "Balanced lifestyle with minor room to squeeze out additional savings."; }
  else if (score >= 70) { grade = "C"; statusMessage = "Moderate financial strain; consider consolidating subscriptions or setting firmer food budgets."; }
  else { grade = "F"; statusMessage = "Significant custom leaks occurring; recommend freezing cards and redesigning strict emergency budgets."; }

  healthFactors.push({
    name: "Budget Discipline",
    score: Math.max(30, 100 - budgetOverruns * 25),
    status: budgetOverruns > 1 ? "poor" as const : budgetOverruns > 0 ? "moderate" as const : "good" as const
  });

  healthFactors.push({
    name: "Subscription Efficiency",
    score: subscriptionCost > 150 ? 50 : subscriptionCost > 80 ? 75 : 95,
    status: subscriptionCost > 150 ? "poor" as const : subscriptionCost > 80 ? "moderate" as const : "good" as const
  });

  healthFactors.push({
    name: "Savings Intent",
    score: goals.length > 0 ? 90 : 40,
    status: goals.length > 0 ? "good" as const : "poor" as const
  });

  return {
    healthScore: score,
    healthGrade: grade,
    healthMessage: statusMessage,
    healthFactors,
    insights
  };
}

// Full Stack Asset Routing & HMR Support
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics files serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server rolling live on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure:", err);
});
