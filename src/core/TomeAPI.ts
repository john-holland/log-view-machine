/**
 * TomeAPI - API interface for TomeManager server features
 * 
 * This interface defines the HTTP API for communicating with TomeManager
 * server features, allowing browser clients to interact with server-side
 * Tome functionality without bundling Express or server dependencies.
 */

export interface TomeAPI {
  baseUrl: string;
  
  // Tome Management
  registerTome(config: any): Promise<TomeInstanceResponse>;
  unregisterTome(id: string): Promise<void>;
  getTome(id: string): Promise<TomeInstanceResponse | null>;
  listTomes(): Promise<TomeListResponse>;
  
  // Tome Lifecycle
  startTome(id: string): Promise<void>;
  stopTome(id: string): Promise<void>;
  getTomeStatus(id: string): Promise<TomeStatusResponse>;
  
  // Machine Communication
  sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any): Promise<any>;
  getTomeMachineState(tomeId: string, machineId: string): Promise<any>;
  getTomeMachineContext(tomeId: string, machineId: string): Promise<any>;
}

export interface TomeInstanceResponse {
  id: string;
  config: any;
  context: Record<string, any>;
  status: 'stopped' | 'running' | 'error';
  machines: Record<string, any>;
  startTime?: string;
  error?: string;
}

export interface TomeListResponse {
  tomes: string[];
  count: number;
}

export interface TomeStatusResponse {
  id: string;
  status: 'stopped' | 'running' | 'error';
  startTime?: string;
  error?: string;
  machineStates?: Record<string, any>;
}

export interface TomeMessageRequest {
  tomeId: string;
  machineId: string;
  event: string;
  data?: any;
}

export interface TomeMessageResponse {
  success: boolean;
  result?: any;
  error?: string;
}

