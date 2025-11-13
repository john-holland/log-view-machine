/**
 * TomeAPIRouter - Express router for TomeManager API endpoints
 *
 * This router provides HTTP endpoints that the TomeClient can use to
 * communicate with server-side TomeManager functionality.
 */
import { Router } from 'express';
import { TomeManager } from '../core/TomeManager';
export declare class TomeAPIRouter {
    private router;
    private tomeManager;
    constructor(tomeManager: TomeManager);
    private setupRoutes;
    private tomeInstanceToResponse;
    getRouter(): Router;
}
