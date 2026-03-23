/**
 * Configuration for the Note Analyzer
 * 
 * PASTE YOUR API KEY BELOW if you are not using environment variables.
 * In AI Studio, it is recommended to use the 'Secrets' panel for GEMINI_API_KEY.
 */

export const CONFIG = {
  // 1. PASTE YOUR API KEYS INSIDE THE QUOTES BELOW:
 
  
  // 3. MODELS CONFIGURATION
  MODELS: {
    GEMINI: {
      VISION: "gemini-2.0-flash",
      ANALYSIS: "gemini-2.0-flash",
    },
    GROQ: {
      VISION: "meta-llama/llama-4-scout-17b-16e-instruct",
      ANALYSIS: "llama-3.3-70b-versatile",
    }
  },
  
  // Toggle between "GEMINI" and "GROQ"
  PROVIDER: "GROQ" as "GEMINI" | "GROQ"
};
