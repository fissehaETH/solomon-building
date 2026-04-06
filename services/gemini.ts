
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment. Please ensure the Gemini API is enabled and the key is available.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function getBusinessInsights(products: Product[], sales: Sale[]) {
  const prompt = `
    As a business consultant for "Solomon Building Materials Shop", analyze the current data and provide 3 key insights.
    
    IMPORTANT: Please provide the insights in Amharic (አማርኛ).
    
    Current Inventory:
    ${JSON.stringify(products.map(p => ({ name: p.product_name, stock: p.stock_qty, min: p.min_stock })), null, 2)}
    
    Recent Sales:
    ${JSON.stringify(sales.slice(-10).map(s => ({ item: s.product_name, qty: s.quantity, date: s.date })), null, 2)}
    
    Focus on:
    1. Critical stock levels (low stock) - ወሳኝ የክምችት ደረጃዎች (ዝቅተኛ ክምችት).
    2. Fast-moving items - በፍጥነት የሚሸጡ እቃዎች.
    3. Business growth suggestions - የንግድ ዕድገት ጥቆማዎች.
    
    Format the response as clear, bulleted points in Amharic.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "በአሁኑ ጊዜ ግንዛቤዎችን ማመንጨት አልተቻለም። እባክዎ የክምችት ደረጃዎን እራስዎ ያረጋግጡ።";
  }
}
