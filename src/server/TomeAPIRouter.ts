/**
 * TomeAPIRouter - Express router for TomeManager API endpoints
 * 
 * This router provides HTTP endpoints that the TomeClient can use to
 * communicate with server-side TomeManager functionality.
 */

import express, { Request, Response, Router } from 'express';
import { TomeManager } from '../core/TomeManager';
import { TomeInstanceResponse, TomeListResponse, TomeStatusResponse } from '../core/TomeAPI';

export class TomeAPIRouter {
  private router: Router;
  private tomeManager: TomeManager;
  
  constructor(tomeManager: TomeManager) {
    this.tomeManager = tomeManager;
    this.router = express.Router();
    this.setupRoutes();
  }
  
  private setupRoutes(): void {
    // Register a new Tome
    this.router.post('/', async (req: Request, res: Response) => {
      try {
        const config = req.body;
        const tomeInstance = await this.tomeManager.registerTome(config);
        const response = this.tomeInstanceToResponse(tomeInstance);
        res.status(201).json(response);
      } catch (error) {
        console.error('Error registering Tome:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // List all Tomes
    this.router.get('/', async (req: Request, res: Response) => {
      try {
        const tomeIds = this.tomeManager.listTomes();
        const response: TomeListResponse = {
          tomes: tomeIds,
          count: tomeIds.length
        };
        res.json(response);
      } catch (error) {
        console.error('Error listing Tomes:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Get a specific Tome
    this.router.get('/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const tomeInstance = this.tomeManager.getTome(id);
        
        if (!tomeInstance) {
          return res.status(404).json({ error: `Tome ${id} not found` });
        }
        
        const response = this.tomeInstanceToResponse(tomeInstance);
        res.json(response);
      } catch (error) {
        console.error('Error getting Tome:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Unregister a Tome
    this.router.delete('/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        await this.tomeManager.unregisterTome(id);
        res.status(204).send();
      } catch (error) {
        console.error('Error unregistering Tome:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Start a Tome
    this.router.post('/:id/start', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        await this.tomeManager.startTome(id);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error starting Tome:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Stop a Tome
    this.router.post('/:id/stop', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        await this.tomeManager.stopTome(id);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error stopping Tome:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Get Tome status
    this.router.get('/:id/status', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const tomeInstance = this.tomeManager.getTome(id);
        
        if (!tomeInstance) {
          return res.status(404).json({ error: `Tome ${id} not found` });
        }
        
        const status = this.tomeManager.getTomeStatus();
        const tomeStatus = status.find((s: any) => s.id === id);
        
        const response: TomeStatusResponse = {
          id,
          status: tomeStatus?.status || 'stopped',
          startTime: tomeStatus?.startTime,
          error: tomeStatus?.error,
          machineStates: tomeStatus?.machineStates
        };
        
        res.json(response);
      } catch (error) {
        console.error('Error getting Tome status:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Send message to a Tome machine
    this.router.post('/:id/machines/:machineId/message', async (req: Request, res: Response) => {
      try {
        const { id, machineId } = req.params;
        const { event, data } = req.body;
        
        const result = await this.tomeManager.sendTomeMessage(id, machineId, event, data);
        res.json({ success: true, result });
      } catch (error) {
        console.error('Error sending message to Tome machine:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Get Tome machine state
    this.router.get('/:id/machines/:machineId/state', async (req: Request, res: Response) => {
      try {
        const { id, machineId } = req.params;
        const state = this.tomeManager.getTomeMachineState(id, machineId);
        res.json(state);
      } catch (error) {
        console.error('Error getting Tome machine state:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // Get Tome machine context
    this.router.get('/:id/machines/:machineId/context', async (req: Request, res: Response) => {
      try {
        const { id, machineId } = req.params;
        const context = this.tomeManager.getTomeMachineContext(id, machineId);
        res.json(context);
      } catch (error) {
        console.error('Error getting Tome machine context:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
  }
  
  private tomeInstanceToResponse(tomeInstance: any): TomeInstanceResponse {
    return {
      id: tomeInstance.id,
      config: tomeInstance.config,
      context: tomeInstance.context,
      status: 'running', // TODO: Get actual status
      machines: Object.fromEntries(tomeInstance.machines || new Map())
    };
  }
  
  public getRouter(): Router {
    return this.router;
  }
}



