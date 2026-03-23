export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface AgentLog {
  id: string;
  agentName: string;
  message: string;
  timestamp: number;
  status: AgentStatus;
  data?: any; // Raw output from the agent
}

export interface AnalysisResult {
  extractedText: string;
  topics: string[];
  missingConcepts: string[];
  weakAreas: string[];
  suggestions: string[];
  confidenceScore: number;
  logs: AgentLog[];
}

export interface AgentError {
  agentName: string;
  message: string;
  type: 'VISION_ERROR' | 'KNOWLEDGE_ERROR' | 'ANALYSIS_ERROR' | 'PIPELINE_ERROR';
  details?: string;
}

export interface NoteAnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  logs: AgentLog[];
  error: AgentError | null;
}
