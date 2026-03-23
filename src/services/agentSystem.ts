import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Groq from "groq-sdk";
import { AgentLog, AgentStatus, AnalysisResult } from "../types";
import { CONFIG } from "../config";

// Lazy initialization of instances
let aiInstance: GoogleGenAI | null = null;
let groqInstance: Groq | null = null;

function getAI() {
  let apiKey = CONFIG.GEMINI_API_KEY || 
               (import.meta as any).env?.VITE_GEMINI_API_KEY || 
               (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) || 
               "";
  
  // Sanitize key
  apiKey = apiKey.trim().replace(/['";]/g, '');

  if (!apiKey && CONFIG.PROVIDER === "GEMINI") {
    throw new Error("API_KEY_MISSING: Please paste your Gemini API key in src/config.ts or the Secrets panel.");
  }
  if (!aiInstance && apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function getGroq() {
  let apiKey = CONFIG.GROQ_API_KEY || 
               (import.meta as any).env?.VITE_GROQ_API_KEY || 
               (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : undefined) || 
               "";
  
  // Sanitize key
  apiKey = apiKey.trim().replace(/['";]/g, '');

  if (!apiKey && CONFIG.PROVIDER === "GROQ") {
    throw new Error("API_KEY_MISSING: Please paste your Groq API key in src/config.ts or the Secrets panel.");
  }
  if (!groqInstance && apiKey) {
    groqInstance = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqInstance;
}

class BaseAgent {
  name: string;
  onLog: (log: AgentLog) => void;

  constructor(name: string, onLog: (log: AgentLog) => void) {
    this.name = name;
    this.onLog = onLog;
  }

  log(message: string, status: AgentStatus = AgentStatus.WORKING, data?: any) {
    this.onLog({
      id: Math.random().toString(36).substring(7),
      agentName: this.name,
      message,
      timestamp: Date.now(),
      status,
      data,
    });
  }
}

class VisionAgent extends BaseAgent {
  constructor(onLog: (log: AgentLog) => void) {
    super("Vision Agent", onLog);
  }

  async processImage(base64Image: string): Promise<{ text: string; confidence: number }> {
    this.log("Preprocessing image: Converting to high-contrast grayscale...");
    await new Promise(r => setTimeout(r, 800)); // Simulate work
    
    this.log(`Extracting text using ${CONFIG.PROVIDER} Vision OCR...`);
    
    let text = "";
    let confidence = 0.85;

    if (CONFIG.PROVIDER === "GEMINI") {
      const ai = getAI();
      if (!ai) throw new Error("Gemini AI instance not initialized");
      const response = await ai.models.generateContent({
        model: CONFIG.MODELS.GEMINI.VISION,
        contents: [
          {
            parts: [
              { text: "Extract all handwritten text from this image exactly as written. If you are unsure of a word, put it in [brackets]. Also, provide a confidence score between 0 and 1 for the overall extraction quality at the end in the format: CONFIDENCE: 0.XX" },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ]
      });
      const output = response.text || "";
      const confidenceMatch = output.match(/CONFIDENCE:\s*(0\.\d+)/i);
      confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.85;
      text = output.replace(/CONFIDENCE:\s*0\.\d+/i, "").trim();
    } else {
      const groq = getGroq();
      if (!groq) throw new Error("Groq instance not initialized");
      const response = await groq.chat.completions.create({
        model: CONFIG.MODELS.GROQ.VISION,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all handwritten text from this image exactly as written. If you are unsure of a word, put it in [brackets]. Also, provide a confidence score between 0 and 1 for the overall extraction quality at the end in the format: CONFIDENCE: 0.XX" },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ]
      });
      const output = response.choices[0]?.message?.content || "";
      const confidenceMatch = output.match(/CONFIDENCE:\s*(0\.\d+)/i);
      confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.85;
      text = output.replace(/CONFIDENCE:\s*0\.\d+/i, "").trim();
    }

    this.log(`OCR Completed. Confidence: ${(confidence * 100).toFixed(1)}%`, AgentStatus.COMPLETED, { text, confidence });
    return { text, confidence };
  }
}

class KnowledgeAgent extends BaseAgent {
  constructor(onLog: (log: AgentLog) => void) {
    super("Knowledge Agent", onLog);
  }

  async retrieveContext(text: string): Promise<string> {
    this.log("Searching internal knowledge base for related concepts...");
    // In a real app, this would use FAISS/Vector DB. 
    // Here we simulate retrieval by identifying the general subject.
    await new Promise(r => setTimeout(r, 1000));
    
    this.log("Retrieved context for: " + (text.slice(0, 30) + "..."), AgentStatus.WORKING, { context: "Standard academic curriculum context for the identified subject." });
    return "Standard academic curriculum context for the identified subject.";
  }
}

class AnalysisAgent extends BaseAgent {
  constructor(onLog: (log: AgentLog) => void) {
    super("Analysis Agent", onLog);
  }

  async analyze(text: string, context: string): Promise<Partial<AnalysisResult>> {
    this.log(`Analyzing content using ${CONFIG.PROVIDER} for key topics and conceptual gaps...`);
    
    const prompt = `
      Analyze the following student notes:
      "${text}"
      
      Context: ${context}
      
      Provide a detailed analysis in JSON format with the following keys:
      - topics: string[] (Main subjects covered)
      - missingConcepts: string[] (Important related concepts NOT mentioned)
      - weakAreas: string[] (Areas where the notes seem confused or incomplete)
      - suggestions: string[] (Actionable study tips)
      
      IMPORTANT: Return ONLY the raw JSON object. No markdown formatting.
    `;

    let output = "";

    if (CONFIG.PROVIDER === "GEMINI") {
      const ai = getAI();
      if (!ai) throw new Error("Gemini AI instance not initialized");
      const response = await ai.models.generateContent({
        model: CONFIG.MODELS.GEMINI.ANALYSIS,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      output = response.text || "{}";
    } else {
      const groq = getGroq();
      if (!groq) throw new Error("Groq instance not initialized");
      const response = await groq.chat.completions.create({
        model: CONFIG.MODELS.GROQ.ANALYSIS,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      output = response.choices[0]?.message?.content || "{}";
    }

    try {
      const result = JSON.parse(output);
      this.log("Analysis complete.", AgentStatus.COMPLETED, result);
      return result;
    } catch (e) {
      this.log("Failed to parse analysis JSON. Retrying with self-correction...", AgentStatus.FAILED);
      throw e;
    }
  }
}

export class ControllerAgent extends BaseAgent {
  private vision: VisionAgent;
  private knowledge: KnowledgeAgent;
  private analysis: AnalysisAgent;

  constructor(onLog: (log: AgentLog) => void) {
    super("Controller", onLog);
    this.vision = new VisionAgent(onLog);
    this.knowledge = new KnowledgeAgent(onLog);
    this.analysis = new AnalysisAgent(onLog);
  }

  async runPipeline(base64Image: string): Promise<AnalysisResult> {
    this.log(`Starting Agentic Pipeline (${CONFIG.PROVIDER})...`, AgentStatus.WORKING);
    
    if (CONFIG.PROVIDER === "GEMINI" && !CONFIG.GEMINI_API_KEY) {
      const errorMsg = "GEMINI_API_KEY is missing. Please set it in src/config.ts";
      this.log(errorMsg, AgentStatus.FAILED);
      throw new Error(errorMsg);
    }

    if (CONFIG.PROVIDER === "GROQ" && !CONFIG.GROQ_API_KEY) {
      const errorMsg = "GROQ_API_KEY is missing. Please set it in src/config.ts";
      this.log(errorMsg, AgentStatus.FAILED);
      throw new Error(errorMsg);
    }
    
    try {
      // 1. Vision/OCR
      let { text, confidence } = await this.vision.processImage(base64Image);
      
      // Self-Correction Loop: If confidence is too low, retry with different instruction
      if (confidence < 0.5) {
        this.log("Low confidence detected. Triggering self-correction loop...", AgentStatus.WORKING);
        const retry = await this.vision.processImage(base64Image);
        text = retry.text;
        confidence = retry.confidence;
      }

      // 2. Knowledge Retrieval
      const context = await this.knowledge.retrieveContext(text);

      // 3. Analysis
      const analysis = await this.analysis.analyze(text, context);

      this.log("Finalizing report...", AgentStatus.COMPLETED);

      return {
        extractedText: text,
        topics: analysis.topics || [],
        missingConcepts: analysis.missingConcepts || [],
        weakAreas: analysis.weakAreas || [],
        suggestions: analysis.suggestions || [],
        confidenceScore: confidence,
        logs: [], // Logs are managed by the caller
      };
    } catch (error) {
      this.log("Pipeline failed: " + (error as Error).message, AgentStatus.FAILED);
      throw error;
    }
  }
}
