/**
 * Express Cave server adapter.
 * Implements CaveServerAdapter by delegating to TomeManager and Express.
 */

import express, { type Application, type Request, type Response } from 'express';
import { TomeManager, parseToken, validateToken, createCircuitBreaker, createThrottlePolicy } from 'log-view-machine';
import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';
import type { NormalizedRequest, NormalizedResponse } from 'log-view-machine';
import type { CircuitBreaker } from 'log-view-machine';
import type { ThrottlePolicy } from 'log-view-machine';

export interface CorsOptions {
  origin?: string | string[] | RegExp;
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

export interface Http2Options {
  allowHTTP1?: boolean;
}

export interface ThrottleAdapterConfig {
  maxRequestsPerMinute?: number;
  maxBytesPerMinute?: number;
  windowMs?: number;
}

export interface CircuitBreakerAdapterConfig {
  threshold?: number;
  resetMs?: number;
  name?: string;
}

export interface ExpressCaveAdapterOptions {
  /** Optional: use an existing Express app. If not provided, one is created. */
  app?: Application;
  /** Base path for API routes (default from Tome config or /api). */
  apiBasePath?: string;
  /** Path for Address registry when sections.registry is true (default /registry). */
  registryPath?: string;
  /** CORS: true for defaults, or full options. Applied once at adapter level. */
  cors?: boolean | CorsOptions;
  /** When true, use HTTP/2 for server creation (see createHttp2Server). */
  http2?: boolean | Http2Options;
  /** Optional: throttle config; when resourceMonitor is in context, middleware returns 429 when over limit. */
  throttle?: ThrottleAdapterConfig;
  /** Optional: circuit breaker config; when resourceMonitor is in context, middleware returns 503 when open. */
  circuitBreaker?: CircuitBreakerAdapterConfig;
}

function toNormalizedRequest(req: Request): NormalizedRequest {
  const url = req.originalUrl || req.url;
  const path = req.path || url.split('?')[0];
  const query: Record<string, string | string[]> = {};
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      query[k] = Array.isArray(v) ? v as string[] : (v as string);
    }
  }
  const headers: Record<string, string> = {};
  if (req.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
  }
  return {
    url,
    path,
    method: req.method || 'GET',
    query,
    headers,
    body: (req as any).body,
  };
}

function sendNormalizedResponse(res: Response, nr: NormalizedResponse): void {
  res.status(nr.status);
  if (nr.headers) {
    for (const [k, v] of Object.entries(nr.headers)) {
      res.setHeader(k, String(v));
    }
  }
  if (nr.body !== undefined) {
    res.json(nr.body);
  } else {
    res.end();
  }
}

export function expressCaveAdapter(options: ExpressCaveAdapterOptions = {}): CaveServerAdapter & { getApp(): Application } {
  const app: Application = options.app ?? express();
  if (!options.app) {
    app.use(express.json());
  }
  const registryPath = options.registryPath ?? '/registry';
  let tomeManager: TomeManager | null = null;

  const adapter: CaveServerAdapter & { getApp(): Application } = {
    getApp() {
      return app;
    },

    registerRoute(method: string, path: string, handler: (req: NormalizedRequest) => Promise<NormalizedResponse> | NormalizedResponse) {
      const m = method.toLowerCase();
      (app as any)[m](path, async (req: Request, res: Response) => {
        try {
          const normReq = toNormalizedRequest(req);
          const normRes = await Promise.resolve(handler(normReq));
          sendNormalizedResponse(res, normRes);
        } catch (err: any) {
          res.status(500).json({ error: err?.message ?? String(err) });
        }
      });
    },

    mount(basePath: string, routeHandlerBag: unknown) {
      app.use(basePath, routeHandlerBag as express.Router);
    },

    use(middleware: (req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => Promise<NormalizedResponse>) {
      app.use(async (req: Request, res: Response, next: () => void) => {
        try {
          const normReq = toNormalizedRequest(req);
          await middleware(normReq, async () => {
            (req as any).__next = true;
            return { status: 200, body: {} };
          });
          next();
        } catch (err) {
          next();
        }
      });
    },

    async apply(context: CaveServerContext): Promise<void> {
      const { cave, tomeConfigs, sections, resourceMonitor } = context;

      const caveConfig = cave.getConfig();
      const security = caveConfig.security;
      const opts = options as ExpressCaveAdapterOptions;

      if (opts.cors !== undefined) {
        const c = typeof opts.cors === 'object' ? opts.cors : {};
        const origin = c.origin ?? (typeof opts.cors === 'boolean' && opts.cors ? '*' : undefined);
        const methods = c.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
        const allowedHeaders = c.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Cave-Message-Token'];
        app.use((_req: Request, res: Response, next: () => void) => {
          if (origin) res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin[0] : String(origin));
          res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
          res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
          if (c.credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
          if (c.maxAge != null) res.setHeader('Access-Control-Max-Age', String(c.maxAge));
          next();
        });
      }

      if (security?.messageToken) {
        const secretEnv = security.messageToken.secretEnv ?? 'CAVE_MESSAGE_TOKEN_SECRET';
        const headerName = security.messageToken.header ?? 'X-Cave-Message-Token';
        const secret = typeof process !== 'undefined' && process.env?.[secretEnv];
        if (secret) {
          app.use((req: Request, res: Response, next: (err?: any) => void) => {
            const method = (req.method ?? 'GET').toUpperCase();
            if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();
            const rawHeader = req.get(headerName);
            const bodyToken = req.body?._messageToken;
            const token = rawHeader
              ? parseToken(rawHeader)
              : bodyToken != null
                ? (typeof bodyToken === 'string' ? parseToken(bodyToken) : bodyToken)
                : null;
            if (!token || !token.salt || !token.hash) {
              return res.status(403).json({ error: 'Message token required' });
            }
            const channelId = req.path ?? '';
            const payloadSummary = (req.body?.action ?? req.body?.messageId ?? '').toString();
            const valid = validateToken({ token, channelId, payloadSummary, secret, checkExpiry: true });
            if (!valid) return res.status(403).json({ error: 'Invalid message token' });
            next();
          });
        }
      }

      let adapterCircuit: CircuitBreaker | null = null;
      let adapterThrottle: ThrottlePolicy | null = null;
      if (opts.throttle && resourceMonitor) {
        adapterThrottle = createThrottlePolicy({ config: opts.throttle, monitor: resourceMonitor });
        app.use((_req: Request, res: Response, next: () => void) => {
          if (adapterThrottle!.isOverLimit()) {
            res.setHeader('Retry-After', '60');
            res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
            return;
          }
          next();
        });
      }
      if (opts.circuitBreaker && resourceMonitor) {
        adapterCircuit = createCircuitBreaker({
          name: opts.circuitBreaker.name ?? 'express',
          threshold: opts.circuitBreaker.threshold,
          resetMs: opts.circuitBreaker.resetMs,
          monitor: resourceMonitor,
        });
        app.use((_req: Request, res: Response, next: () => void) => {
          if (!adapterCircuit!.allowRequest()) {
            res.status(503).json({ error: 'Service unavailable', circuitOpen: true });
            return;
          }
          next();
        });
      }
      if (resourceMonitor) {
        app.use((req: Request, res: Response, next: () => void) => {
          const start = Date.now();
          const contentLength = req.headers['content-length'];
          const bytesIn = contentLength ? parseInt(String(contentLength), 10) : undefined;
          res.on('finish', () => {
            const bytesOut = res.getHeader('Content-Length') ? parseInt(String(res.getHeader('Content-Length')), 10) : 0;
            resourceMonitor.trackRequest({
              path: req.path,
              method: req.method,
              bytesIn,
              bytesOut: Number.isFinite(bytesOut) ? bytesOut : undefined,
              latencyMs: Date.now() - start,
              status: res.statusCode,
            });
            if (adapterThrottle) adapterThrottle.record(bytesIn ?? 0, Number.isFinite(bytesOut) ? bytesOut : 0);
            if (adapterCircuit) {
              if (res.statusCode >= 400) adapterCircuit.recordFailure();
              else adapterCircuit.recordSuccess();
            }
          });
          next();
        });
      }

      if (security?.transport?.tls) {
        app.use((req: Request, res: Response, next: () => void) => {
          if (req.secure) return next();
          const host = req.get('host') ?? '';
          res.redirect(301, `https://${host}${req.originalUrl ?? req.url}`);
        });
      }

      if (security?.authentication?.required && security.authentication.type === 'api-key') {
        app.use((req: Request, res: Response, next: () => void) => {
          const key = req.get('x-api-key') || req.get('authorization');
          if (key) return next();
          res.status(401).json({ error: 'Authentication required (API key)' });
        });
      }

      if (security?.authentication?.required && security.authentication.type === 'jwt') {
        app.use((req: Request, res: Response, next: () => void) => {
          const auth = req.get('authorization');
          if (auth?.startsWith('Bearer ')) return next();
          res.status(401).json({ error: 'Authentication required (JWT)' });
        });
      }

      tomeManager = new TomeManager(app);

      for (const config of tomeConfigs) {
        await tomeManager.registerTome(config);
      }

      const tomes = Array.from(tomeManager.tomes.values()) as Array<{ start(): Promise<void> }>;
      for (const tome of tomes) {
        await tome.start();
      }

      if (sections.registry === true) {
        app.get(registryPath, (_req: Request, res: Response) => {
          const config = cave.getConfig();
          const spelunk = config.spelunk;
          const addresses: Array<{ name: string; route?: string; container?: string; tomeId?: string; subdomains?: unknown }> = [];
          if (spelunk.childCaves) {
            for (const [name, child] of Object.entries(spelunk.childCaves)) {
              const c = child as { route?: string; container?: string; tomeId?: string; subdomains?: unknown };
              addresses.push({
                name,
                route: c.route,
                container: c.container,
                tomeId: c.tomeId,
                subdomains: c.subdomains,
              });
            }
          }
          res.json({ cave: config.name, addresses });
        });
      }
    },
  };

  return adapter;
}

/**
 * Create an HTTP or HTTP/2 server for the Express app. Use when http2 option is true.
 * In production, HTTP/2 is often terminated at a reverse proxy (ALB, OpenShift); this applies when Node is the TLS endpoint.
 */
export function createServer(
  app: Application,
  options: { http2?: boolean | Http2Options; port?: number; tls?: { cert: string; key: string } }
): import('http').Server | import('http2').Http2SecureServer | import('http2').Http2Server {
  const useHttp2 = options.http2 === true || (typeof options.http2 === 'object' && options.http2 !== null);
  if (useHttp2 && options.tls?.cert && options.tls?.key) {
    const http2 = require('http2');
    return http2.createSecureServer(
      { cert: options.tls.cert, key: options.tls.key, allowHTTP1: (options.http2 as Http2Options)?.allowHTTP1 !== false },
      app as any
    );
  }
  if (useHttp2) {
    const http2 = require('http2');
    return http2.createServer({ allowHTTP1: (options.http2 as Http2Options)?.allowHTTP1 !== false }, app as any);
  }
  const http = require('http');
  return http.createServer(app);
}
