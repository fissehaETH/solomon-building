
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getBusinessInsights(products: Product[], sales: Sale[]) {
  const prompt = `
    As a business consultant for "Solomon Building Materials Shop", analyze the current data and provide 3 key insights.
    
    Current Inventory:
    ${JSON.stringify(products.map(p => ({ name: p.product_name, stock: p.stock_qty, min: p.min_stock })), null, 2)}
    
    Recent Sales:
    ${JSON.stringify(sales.slice(-10).map(s => ({ item: s.product_name, qty: s.quantity, date: s.date })), null, 2)}
    
    Focus on:
    1. Critical stock levels (low stock).
    2. Fast-moving items.
    3. Business growth suggestions.
    
    Format the response as clear, bulleted points.
  `;

  try {
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
    return "Unable to generate insights at this moment. Please check your stock levels manually.";
  }
}
