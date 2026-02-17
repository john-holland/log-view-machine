/**
 * Continuum Cave Adapter
 * Mounts proxy routes so Cave can offer the continuum library API (search, documents, download).
 * Set CONTINUUM_LIBRARY_URL (e.g. http://localhost:5050) and optionally pass getTenantFromRequest(req).
 * When getTenantApiKey(tenantId) is provided, sends X-API-Key per tenant for Continuum per-tenant auth.
 */

/**
 * @param {Object} options
 * @param {string} options.continuumBaseUrl - Base URL of the continuum server (e.g. from process.env.CONTINUUM_LIBRARY_URL).
 * @param {(req: import('express').Request) => string} [options.getTenantFromRequest] - Return tenant for X-Tenant-ID (e.g. deriveTenantFromRequest(req)).
 * @param {(tenantId: string) => string | Promise<string | null>} [options.getTenantApiKey] - Return API key for tenant; when present, adapter sends X-API-Key to Continuum.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void }} [options.logger]
 * @returns {{ mount(app: import('express').Application, basePath?: string): void }}
 */
export function createContinuumCaveAdapter(options) {
  const {
    continuumBaseUrl = process.env.CONTINUUM_LIBRARY_URL || '',
    getTenantFromRequest,
    getTenantApiKey,
    logger = {},
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function headersForTenant(tenant) {
    const headers = { 'X-Tenant-ID': tenant };
    if (typeof getTenantApiKey === 'function') {
      const key = await Promise.resolve(getTenantApiKey(tenant));
      if (key && typeof key === 'string') headers['X-API-Key'] = key;
    }
    return headers;
  }

  function mount(app, basePath = '/api/continuum/library') {
    const base = (continuumBaseUrl && continuumBaseUrl.trim()) ? continuumBaseUrl.replace(/\/$/, '') : '';
    if (!base) {
      log('info', '[continuum-cave-adapter] CONTINUUM_LIBRARY_URL not set; skipping continuum proxy routes');
      return;
    }

    const getTenant = (req) => (typeof getTenantFromRequest === 'function' ? getTenantFromRequest(req) : 'default');

    app.get(basePath + '/search', async (req, res) => {
      try {
        const tenant = getTenant(req);
        const qs = new URLSearchParams(req.query).toString();
        const url = base + '/api/library/search' + (qs ? '?' + qs : '');
        const headers = await headersForTenant(tenant);
        const r = await fetch(url, { headers });
        const data = await r.json().catch(() => ({}));
        res.status(r.status).json(data);
      } catch (err) {
        log('warn', '[continuum-cave-adapter] search error: ' + (err?.message || err));
        res.status(502).json({ error: err?.message || 'Continuum proxy error' });
      }
    });

    app.get(basePath + '/documents/:id', async (req, res) => {
      try {
        const tenant = getTenant(req);
        const url = base + '/api/library/documents/' + req.params.id + '?tenant=' + encodeURIComponent(tenant);
        const headers = await headersForTenant(tenant);
        const r = await fetch(url, { headers });
        const data = await r.json().catch(() => ({}));
        res.status(r.status).json(data);
      } catch (err) {
        log('warn', '[continuum-cave-adapter] get document error: ' + (err?.message || err));
        res.status(502).json({ error: err?.message || 'Continuum proxy error' });
      }
    });

    app.get(basePath + '/documents/:id/download', async (req, res) => {
      try {
        const tenant = getTenant(req);
        const url = base + '/api/library/documents/' + req.params.id + '/download?tenant=' + encodeURIComponent(tenant);
        const headers = await headersForTenant(tenant);
        const r = await fetch(url, { headers });
        if (!r.ok) {
          const text = await r.text();
          return res.status(r.status).send(text || r.statusText);
        }
        const contentType = r.headers.get('content-type') || 'application/octet-stream';
        const disposition = r.headers.get('content-disposition');
        res.setHeader('Content-Type', contentType);
        if (disposition) res.setHeader('Content-Disposition', disposition);
        const buf = await r.arrayBuffer();
        res.send(Buffer.from(buf));
      } catch (err) {
        log('warn', '[continuum-cave-adapter] download error: ' + (err?.message || err));
        res.status(502).json({ error: err?.message || 'Continuum proxy error' });
      }
    });

    log('info', '[continuum-cave-adapter] Proxying ' + basePath + ' to ' + base);
  }

  return { mount };
}

export default { createContinuumCaveAdapter };
