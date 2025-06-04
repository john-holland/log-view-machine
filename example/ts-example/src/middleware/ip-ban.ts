import { Request, Response, NextFunction } from 'express';
import { isFeatureEnabled, recordFailedAttempt, resetFailedAttempts } from '../config/feature-toggles';

export async function ipBanMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!isFeatureEnabled('enable-ip-banning')) {
        return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    if (!ip) {
        return next();
    }

    try {
        // Check if IP is banned
        const isBanned = await isFeatureEnabled('enable-ip-banning', {
            remoteAddress: ip,
            strategy: 'ip-ban'
        });

        if (!isBanned) {
            return res.status(403).json({
                error: 'IP banned',
                message: 'Too many failed attempts. Please try again later.'
            });
        }

        // Record successful attempt
        await resetFailedAttempts(ip);
        next();
    } catch (error) {
        console.error('IP ban middleware error:', error);
        next();
    }
}

export async function recordFailedAuth(req: Request, res: Response, next: NextFunction) {
    if (!isFeatureEnabled('enable-ip-banning')) {
        return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    if (!ip) {
        return next();
    }

    try {
        await recordFailedAttempt(ip);
        next();
    } catch (error) {
        console.error('Failed to record auth attempt:', error);
        next();
    }
} 