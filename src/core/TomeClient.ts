/**
 * TomeClient - Browser-compatible client for TomeManager API
 * 
 * This client implements the TomeManager interface but communicates with
 * server-side Tome functionality via HTTP API calls, avoiding the need
 * to bundle Express or other server dependencies in the browser.
 */

import { TomeManager } from './TomeConfig';
import { TomeAPI, TomeInstanceResponse, TomeListResponse, TomeStatusResponse, TomeMessageRequest, TomeMessageResponse } from './TomeAPI';

export class TomeClient implements TomeManager {
  public tomes: Map<string, any> = new Map();
  private api: TomeAPI;
  
  constructor(api: TomeAPI) {
    this.api = api;
  }
  
  /**
   * Register a new Tome with the server
   */
  async registerTome(config: any): Promise<any> {
    console.log(`📚 [Client] Registering Tome: ${config.id}`);
    
    try {
      const response = await this.api.registerTome(config);
      
      // Create a client-side proxy for the tome instance
      const tomeInstance = this.createTomeInstanceProxy(response);
      this.tomes.set(config.id, tomeInstance);
      
      console.log(`📚 [Client] Successfully registered Tome: ${config.id}`);
      return tomeInstance;
    } catch (error) {
      console.error(`📚 [Client] Failed to register Tome ${config.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Unregister a Tome from the server
   */
  async unregisterTome(id: string): Promise<void> {
    console.log(`📚 [Client] Unregistering Tome: ${id}`);
    
    try {
      await this.api.unregisterTome(id);
      this.tomes.delete(id);
      console.log(`📚 [Client] Successfully unregistered Tome: ${id}`);
    } catch (error) {
      console.error(`📚 [Client] Failed to unregister Tome ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a Tome instance (from cache or server)
   */
  getTome(id: string): any | undefined {
    return this.tomes.get(id);
  }
  
  /**
   * Start a Tome on the server
   */
  async startTome(id: string): Promise<void> {
    console.log(`📚 [Client] Starting Tome: ${id}`);
    
    try {
      await this.api.startTome(id);
      console.log(`📚 [Client] Successfully started Tome: ${id}`);
    } catch (error) {
      console.error(`📚 [Client] Failed to start Tome ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Stop a Tome on the server
   */
  async stopTome(id: string): Promise<void> {
    console.log(`📚 [Client] Stopping Tome: ${id}`);
    
    try {
      await this.api.stopTome(id);
      console.log(`📚 [Client] Successfully stopped Tome: ${id}`);
    } catch (error) {
      console.error(`📚 [Client] Failed to stop Tome ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * List all registered Tomes
   */
  listTomes(): string[] {
    return Array.from(this.tomes.keys());
  }
  
  /**
   * Create a client-side proxy for a Tome instance
   */
  private createTomeInstanceProxy(response: TomeInstanceResponse): any {
    return {
      id: response.id,
      config: response.config,
      context: response.context,
      machines: response.machines,
      
      async start(): Promise<void> {
        await this.api.startTome(response.id);
      },
      
      async stop(): Promise<void> {
        await this.api.stopTome(response.id);
      },
      
      async sendMessage(machineId: string, event: string, data?: any): Promise<any> {
        const request: TomeMessageRequest = {
          tomeId: response.id,
          machineId,
          event,
          data
        };
        
        const apiResponse = await this.sendTomeMessage(request);
        return apiResponse.result;
      },
      
      async getMachineState(machineId: string): Promise<any> {
        return await this.api.getTomeMachineState(response.id, machineId);
      },
      
      async getMachineContext(machineId: string): Promise<any> {
        return await this.api.getTomeMachineContext(response.id, machineId);
      },
      
      async getStatus(): Promise<TomeStatusResponse> {
        return await this.api.getTomeStatus(response.id);
      }
    };
  }
  
  /**
   * Send a message to a Tome machine (convenience method)
   */
  async sendTomeMessage(request: TomeMessageRequest): Promise<TomeMessageResponse> {
    console.log(`📚 [Client] Sending message to Tome ${request.tomeId}, Machine ${request.machineId}: ${request.event}`);
    
    try {
      const result = await this.api.sendTomeMessage(request.tomeId, request.machineId, request.event, request.data);
      return { success: true, result };
    } catch (error) {
      console.error(`📚 [Client] Failed to send message:`, error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

/**
 * HTTP implementation of TomeAPI
 */
export class HttpTomeAPI implements TomeAPI {
  public baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000/api/tomes') {
    this.baseUrl = baseUrl;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async registerTome(config: any): Promise<TomeInstanceResponse> {
    return this.request<TomeInstanceResponse>('/', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }
  
  async unregisterTome(id: string): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: 'DELETE'
    });
  }
  
  async getTome(id: string): Promise<TomeInstanceResponse | null> {
    try {
      return await this.request<TomeInstanceResponse>(`/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
  
  async listTomes(): Promise<TomeListResponse> {
    return this.request<TomeListResponse>('/');
  }
  
  async startTome(id: string): Promise<void> {
    await this.request<void>(`/${id}/start`, {
      method: 'POST'
    });
  }
  
  async stopTome(id: string): Promise<void> {
    await this.request<void>(`/${id}/stop`, {
      method: 'POST'
    });
  }
  
  async getTomeStatus(id: string): Promise<TomeStatusResponse> {
    return this.request<TomeStatusResponse>(`/${id}/status`);
  }
  
  async sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any): Promise<any> {
    return this.request<any>(`/${tomeId}/machines/${machineId}/message`, {
      method: 'POST',
      body: JSON.stringify({ event, data })
    });
  }
  
  async getTomeMachineState(tomeId: string, machineId: string): Promise<any> {
    return this.request<any>(`/${tomeId}/machines/${machineId}/state`);
  }
  
  async getTomeMachineContext(tomeId: string, machineId: string): Promise<any> {
    return this.request<any>(`/${tomeId}/machines/${machineId}/context`);
  }
}

/**
 * Factory function to create a TomeClient
 */
export function createTomeClient(apiUrl?: string): TomeClient {
  const api = new HttpTomeAPI(apiUrl);
  return new TomeClient(api);
}

