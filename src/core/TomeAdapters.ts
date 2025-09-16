import React from 'react';
import { ISubMachine } from './TomeConfig';

/**
 * ProxyMachineAdapter
 * 
 * Adapter that wraps ProxyRobotCopyStateMachine to implement ISubMachine interface
 */
export class ProxyMachineAdapter implements ISubMachine {
  private machine: any;
  private startTime: number;
  private errorCount: number;
  private eventHandlers: Map<string, Set<(data: any) => void>>;

  constructor(machine: any) {
    this.machine = machine;
    this.startTime = Date.now();
    this.errorCount = 0;
    this.eventHandlers = new Map();
  }

  get machineId(): string {
    return this.machine.machineId || 'unknown-proxy';
  }

  get machineType(): 'proxy' | 'view' | 'background' | 'content' {
    return 'proxy';
  }

  getState(): any {
    return this.machine.getState?.() || { value: 'unknown' };
  }

  getContext(): any {
    return this.machine.getContext?.() || {};
  }

  isInState(stateName: string): boolean {
    const state = this.getState();
    return state.value === stateName || state.matches?.(stateName) || false;
  }

  send(event: string | object): void {
    try {
      this.machine.send?.(event);
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, event });
    }
  }

  canHandle(event: string): boolean {
    // Check if the machine can handle this event based on current state
    const state = this.getState();
    const stateConfig = this.machine.getConfig?.()?.states?.[state.value];
    return stateConfig?.on?.[event] !== undefined;
  }

  async start(): Promise<void> {
    try {
      await this.machine.start?.();
      this.emit('started', { machineId: this.machineId });
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'start' });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.machine.stop?.();
      this.emit('stopped', { machineId: this.machineId });
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'stop' });
      throw error;
    }
  }

  async pause(): Promise<void> {
    // Proxy machines don't typically have pause functionality
    this.emit('paused', { machineId: this.machineId });
  }

  async resume(): Promise<void> {
    // Proxy machines don't typically have resume functionality
    this.emit('resumed', { machineId: this.machineId });
  }

  async routeMessage(message: any): Promise<any> {
    try {
      // Route message through the proxy's robot copy functionality
      if (this.machine.robotCopy?.sendMessage) {
        return await this.machine.robotCopy.sendMessage(message);
      }
      return { success: false, error: 'No routing capability' };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'routeMessage' });
      throw error;
    }
  }

  async sendToParent(message: any): Promise<any> {
    // Proxy machines typically send to parent through their robot copy
    return this.routeMessage(message);
  }

  async sendToChild(_machineId: string, _message: any): Promise<any> {
    // Proxy machines don't typically have children
    return { success: false, error: 'Proxy machines do not have children' };
  }

  async broadcast(message: any): Promise<any> {
    return this.routeMessage(message);
  }

  getConfig(): any {
    return this.machine.getConfig?.() || {};
  }

  updateConfig(config: Partial<any>): void {
    // Proxy machines typically don't support runtime config updates
    this.emit('configUpdateRequested', { config });
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastHeartbeat: number;
    errorCount: number;
    uptime: number;
  } {
    return {
      status: this.errorCount > 10 ? 'unhealthy' : this.errorCount > 5 ? 'degraded' : 'healthy',
      lastHeartbeat: Date.now(),
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime
    };
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  subscribe(callback: (data: any) => void): { unsubscribe: () => void } {
    return this.machine.subscribe?.(callback) || {
      unsubscribe: () => {
        console.log('🌊 ProxyMachineAdapter: No subscription to unsubscribe from');
      }
    };
  }
}

/**
 * ViewMachineAdapter
 * 
 * Adapter that wraps ViewStateMachine to implement ISubMachine interface
 */
export class ViewMachineAdapter implements ISubMachine {
  private machine: any;
  private startTime: number;
  private errorCount: number;
  private eventHandlers: Map<string, Set<(data: any) => void>>;

  constructor(machine: any) {
    this.machine = machine;
    this.startTime = Date.now();
    this.errorCount = 0;
    this.eventHandlers = new Map();
  }

  get machineId(): string {
    return this.machine.machineId || 'unknown-view';
  }

  get machineType(): 'proxy' | 'view' | 'background' | 'content' {
    return 'view';
  }

  getState(): any {
    return this.machine.getState?.() || { value: 'unknown' };
  }

  getContext(): any {
    return this.machine.getContext?.() || {};
  }

  isInState(stateName: string): boolean {
    const state = this.getState();
    return state.value === stateName || state.matches?.(stateName) || false;
  }

  send(event: string | object): void {
    try {
      this.machine.send?.(event);
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, event });
    }
  }

  canHandle(event: string): boolean {
    const state = this.getState();
    const stateConfig = this.machine.getConfig?.()?.states?.[state.value];
    return stateConfig?.on?.[event] !== undefined;
  }

  async start(): Promise<void> {
    try {
      await this.machine.start?.();
      this.emit('started', { machineId: this.machineId });
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'start' });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.machine.stop?.();
      this.emit('stopped', { machineId: this.machineId });
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'stop' });
      throw error;
    }
  }

  async pause(): Promise<void> {
    // View machines can be paused by stopping event processing
    this.emit('paused', { machineId: this.machineId });
  }

  async resume(): Promise<void> {
    // View machines can be resumed by restarting event processing
    this.emit('resumed', { machineId: this.machineId });
  }

  async routeMessage(message: any): Promise<any> {
    try {
      // View machines route messages through their state machine
      this.send(message);
      return { success: true, message: 'Message routed to state machine' };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'routeMessage' });
      throw error;
    }
  }

  async sendToParent(message: any): Promise<any> {
    // View machines can send messages to parent through extension messaging
    try {
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
        return await (window as any).chrome.runtime.sendMessage(message);
      }
      return { success: false, error: 'No parent communication available' };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error, action: 'sendToParent' });
      throw error;
    }
  }

  async sendToChild(_machineId: string, _message: any): Promise<any> {
    // View machines don't typically have children
    return { success: false, error: 'View machines do not have children' };
  }

  async broadcast(message: any): Promise<any> {
    // View machines can broadcast through extension messaging
    return this.sendToParent(message);
  }

  render?(): React.ReactNode {
    // Delegate to the machine's render method if it exists
    return this.machine.render?.() || null;
  }

  getConfig(): any {
    return this.machine.getConfig?.() || {};
  }

  updateConfig(config: Partial<any>): void {
    // View machines can update their configuration
    this.emit('configUpdateRequested', { config });
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastHeartbeat: number;
    errorCount: number;
    uptime: number;
  } {
    return {
      status: this.errorCount > 10 ? 'unhealthy' : this.errorCount > 5 ? 'degraded' : 'healthy',
      lastHeartbeat: Date.now(),
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime
    };
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  subscribe(callback: (data: any) => void): { unsubscribe: () => void } {
    return this.machine.subscribe?.(callback) || {
      unsubscribe: () => {
        console.log('🌊 ViewMachineAdapter: No subscription to unsubscribe from');
      }
    };
  }
}

/**
 * LazyTomeManager - Only instantiated when needed
 */
export class LazyTomeManager {
  private tome: any;
  private isInitialized: boolean = false;
  private subTomes: Map<string, any> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private renderKey: number = 0;

  constructor(tome: any) {
    this.tome = tome;
  }
  
  // Lazy initialization
  private _ensureInitialized(): void {
    if (!this.isInitialized) {
      console.log('🌊 LazyTomeManager: Initializing for tome', this.tome.id);
      this.isInitialized = true;
      this.tome.isStarted = false;
      this.tome.isRegistered = false;
    }
  }
  
  // TomeManager methods
  registerTome(tome: any): { success: boolean } {
    this._ensureInitialized();
    console.log('🌊 LazyTomeManager: Registering tome', tome.id);
    this.subTomes.set(tome.id, tome);
    return { success: true };
  }
  
  startTome(tomeId: string): { success: boolean } {
    this._ensureInitialized();
    console.log('🌊 LazyTomeManager: Starting tome', tomeId);
    
    if (tomeId === this.tome.id) {
      this.tome.isStarted = true;
      // Start all sub-machines
      Object.values(this.tome.machines || {}).forEach((machine: any) => {
        if (machine.start) {
          machine.start();
        }
      });
    } else {
      const subTome = this.subTomes.get(tomeId);
      if (subTome && subTome.start) {
        subTome.start();
      }
    }
    
    this.emit('tomeStarted', { tomeId });
    return { success: true };
  }
  
  stopTome(tomeId: string): { success: boolean } {
    this._ensureInitialized();
    console.log('🌊 LazyTomeManager: Stopping tome', tomeId);
    
    if (tomeId === this.tome.id) {
      this.tome.isStarted = false;
      // Stop all sub-machines
      Object.values(this.tome.machines || {}).forEach((machine: any) => {
        if (machine.stop) {
          machine.stop();
        }
      });
    } else {
      const subTome = this.subTomes.get(tomeId);
      if (subTome && subTome.stop) {
        subTome.stop();
      }
    }
    
    this.emit('tomeStopped', { tomeId });
    return { success: true };
  }
  
  getTome(tomeId: string): any {
    this._ensureInitialized();
    console.log('🌊 LazyTomeManager: Getting tome', tomeId);
    
    if (tomeId === this.tome.id) {
      return this.tome;
    }
    return this.subTomes.get(tomeId) || null;
  }
  
  // Event system
  on(event: string, handler: (data: any) => void): LazyTomeManager {
    this._ensureInitialized();
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return this;
  }
  
  off(event: string, handler: (data: any) => void): LazyTomeManager {
    this._ensureInitialized();
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }
  
  emit(event: string, data: any): LazyTomeManager {
    this._ensureInitialized();
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`🌊 LazyTomeManager: Error in event handler for ${event}:`, error);
        }
      });
    }
    return this;
  }
  
  // Force re-render
  forceRender(): LazyTomeManager {
    this._ensureInitialized();
    this.renderKey++;
    this.emit('render', { tomeId: this.tome.id, renderKey: this.renderKey });
    return this;
  }

  // Sub-machine management
  getSubMachine(machineId: string): any {
    console.log('🌊 Tome: Getting sub-machine', machineId);
    return this.tome.machines?.[machineId] || null;
  }

  // State management
  getState(): any {
    const states: any = {};
    Object.entries(this.tome.machines || {}).forEach(([id, machine]: [string, any]) => {
      if (machine.getState) {
        states[id] = machine.getState();
      }
    });
    return {
      tomeId: this.tome.id,
      isStarted: this.tome.isStarted || false,
      isRegistered: this.tome.isRegistered || false,
      machines: states
    };
  }

  getContext(): any {
    const contexts: any = {};
    Object.entries(this.tome.machines || {}).forEach(([id, machine]: [string, any]) => {
      if (machine.getContext) {
        contexts[id] = machine.getContext();
      }
    });
    return {
      tomeId: this.tome.id,
      machines: contexts
    };
  }

  // Health monitoring
  getHealth(): any {
    const machineHealth: any = {};
    Object.entries(this.tome.machines || {}).forEach(([id, machine]: [string, any]) => {
      if (machine.getHealth) {
        machineHealth[id] = machine.getHealth();
      }
    });
    
    const overallStatus = Object.values(machineHealth).every((health: any) => 
      health && health.status === 'healthy'
    ) ? 'healthy' : 'degraded';
    
    return {
      status: overallStatus,
      tomeId: this.tome.id,
      isStarted: this.tome.isStarted || false,
      machines: machineHealth
    };
  }

  // Routing
  route(path: string, method: string, data: any): any {
    console.log('🌊 Tome: Routing request', { path, method, tomeId: this.tome.id });
    
    if (!this.tome.routing || !this.tome.routing.routes) {
      return { success: false, error: 'No routing configured' };
    }
    
    // Find matching route
    const route = Object.values(this.tome.routing.routes).find((r: any) => 
      r.path === path && r.method === method
    );
    
    if (!route) {
      return { success: false, error: 'Route not found' };
    }
    
    // Execute route transformer
    if ((route as any).transformers && (route as any).transformers.input) {
      try {
        return (route as any).transformers.input({
          context: this.getContext(),
          event: data,
          send: (event: any) => this.emit('route', event),
          log: (message: string, data: any) => console.log('🌊 Tome Route:', message, data),
          transition: (state: string) => console.log('🌊 Tome: Transitioning to', state),
          machine: this
        });
      } catch (error) {
        console.error('🌊 Tome: Route execution error', error);
        return { success: false, error: (error as Error).message };
      }
    }
    
    return { success: true };
  }
}
