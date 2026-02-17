/**
 * SharePoint Cave Adapter
 * Upload and download files via Microsoft Graph (OAuth2). Exposes stream/embed URLs for Continuum assets.
 * Set Azure app registration env (SHAREPOINT_CLIENT_ID, SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_SECRET)
 * and optionally SHAREPOINT_SITE_ID, SHAREPOINT_DRIVE_ID. Per-tenant credentials via getTenantCredentials(tenantId).
 */

import { ConfidentialClientApplication } from '@azure/msal-node';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const UPLOAD_CHUNK_SIZE = 327680; // 320 KiB min for Graph

/**
 * @param {Object} options
 * @param {string} [options.clientId] - Azure AD app client ID (or process.env.SHAREPOINT_CLIENT_ID).
 * @param {string} [options.tenantId] - Azure AD tenant ID (or process.env.SHAREPOINT_TENANT_ID).
 * @param {string} [options.clientSecret] - Azure AD app secret (or process.env.SHAREPOINT_CLIENT_SECRET).
 * @param {string} [options.siteId] - SharePoint site ID (or process.env.SHAREPOINT_SITE_ID).
 * @param {string} [options.driveId] - SharePoint drive ID (or process.env.SHAREPOINT_DRIVE_ID).
 * @param {(req: import('express').Request) => string} [options.getTenantFromRequest] - Tenant for per-tenant config.
 * @param {(tenantId: string) => Promise<{ clientId: string, tenantId: string, clientSecret: string, siteId?: string, driveId?: string } | null>} [options.getTenantCredentials] - Per-tenant OAuth2 and site/drive.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void }} [options.logger]
 * @returns {{ mount(app: import('express').Application, basePath?: string): void }}
 */
export function createSharePointCaveAdapter(options = {}) {
  const {
    clientId = process.env.SHAREPOINT_CLIENT_ID || '',
    tenantId = process.env.SHAREPOINT_TENANT_ID || '',
    clientSecret = process.env.SHAREPOINT_CLIENT_SECRET || '',
    siteId = process.env.SHAREPOINT_SITE_ID || '',
    driveId = process.env.SHAREPOINT_DRIVE_ID || '',
    getTenantFromRequest,
    getTenantCredentials,
    logger = {},
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function getToken(tenant) {
    let cred = { clientId, tenantId, clientSecret };
    if (typeof getTenantCredentials === 'function' && tenant) {
      const tc = await getTenantCredentials(tenant);
      if (tc) cred = { ...cred, ...tc };
    }
    if (!cred.clientId || !cred.tenantId || !cred.clientSecret) return null;
    const cca = new ConfidentialClientApplication({
      auth: {
        clientId: cred.clientId,
        authority: `https://login.microsoftonline.com/${cred.tenantId}`,
        clientSecret: cred.clientSecret,
      },
    });
    const result = await cca.acquireTokenByClientCredential({ scopes: [GRAPH_SCOPE] });
    return result?.accessToken || null;
  }

  async function getDriveId(tenant, token) {
    let sid = siteId;
    let did = driveId;
    if (typeof getTenantCredentials === 'function' && tenant) {
      const tc = await getTenantCredentials(tenant);
      if (tc?.siteId) sid = tc.siteId;
      if (tc?.driveId) did = tc.driveId;
    }
    if (did) return { siteId: sid, driveId: did };
    if (!sid || !token) return null;
    const r = await fetch(`${GRAPH_BASE}/sites/${sid}/drive`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return { siteId: sid, driveId: data.id };
  }

  function mount(app, basePath = '/api/sharepoint') {
    const getTenant = (req) => (typeof getTenantFromRequest === 'function' ? getTenantFromRequest(req) : 'default');

    if (!clientId && !clientSecret && typeof getTenantCredentials !== 'function') {
      log('info', '[sharepoint-cave-adapter] No SharePoint credentials; skipping routes');
      return;
    }

    app.post(basePath + '/upload', async (req, res) => {
      try {
        const tenant = getTenant(req);
        const token = await getToken(tenant);
        if (!token) {
          return res.status(503).json({ error: 'SharePoint not configured or token failed' });
        }
        const drive = await getDriveId(tenant, token);
        if (!drive?.driveId) {
          return res.status(503).json({ error: 'SharePoint drive not configured' });
        }
        const name = (req.body?.name || req.query?.name || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
        const parentPath = (req.body?.parentPath || req.query?.parentPath || '').trim() || ':';
        const path = parentPath === ':' ? `:/${name}` : `:/${parentPath.replace(/^\/+/, '')}/${name}`;
        let buf = Buffer.from([]);
        if (req.body?.content && typeof req.body.content === 'string') {
          buf = Buffer.from(req.body.content, 'base64');
        } else if (req.body && Buffer.isBuffer(req.body)) {
          buf = req.body;
        } else if (req.body && typeof req.body.pipe === 'function') {
          buf = await streamToBuffer(req.body);
        } else if (req.readable && !req.body) {
          buf = await streamToBuffer(req);
        }
        const len = buf.length;
        if (len === 0) {
          return res.status(400).json({ error: 'No file content' });
        }
        if (len < 4 * 1024 * 1024) {
          const r = await fetch(`${GRAPH_BASE}/drives/${drive.driveId}/root${path}:/content`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': req.headers['content-type'] || 'application/octet-stream',
              'Content-Length': String(len),
            },
            body: buf,
          });
          if (!r.ok) {
            const t = await r.text();
            return res.status(r.status).json({ error: t || r.statusText });
          }
          const data = await r.json();
          return res.status(201).json({ id: data.id, webUrl: data.webUrl, name: data.name });
        }
        const sessionRes = await fetch(`${GRAPH_BASE}/drives/${drive.driveId}/root${path}:/createUploadSession`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { name: name.split('/').pop() || name } }),
        });
        if (!sessionRes.ok) {
          const t = await sessionRes.text();
          return res.status(sessionRes.status).json({ error: t || sessionRes.statusText });
        }
        const { uploadUrl } = await sessionRes.json();
        let offset = 0;
        while (offset < len) {
          const end = Math.min(offset + UPLOAD_CHUNK_SIZE, len);
          const chunk = buf.subarray(offset, end);
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Length': String(chunk.length),
              'Content-Range': `bytes ${offset}-${end - 1}/${len}`,
            },
            body: chunk,
          });
          if (putRes.status === 200 || putRes.status === 201) {
            const data = await putRes.json();
            return res.status(201).json({ id: data.id, webUrl: data.webUrl, name: data.name });
          }
          if (putRes.status !== 202) {
            const t = await putRes.text();
            return res.status(putRes.status).json({ error: t || putRes.statusText });
          }
          const next = (await putRes.json()).nextExpectedRanges;
          if (!next || next.length === 0) break;
          offset = parseInt(next[0].split('-')[0], 10);
        }
        return res.status(500).json({ error: 'Upload session incomplete' });
      } catch (err) {
        log('warn', '[sharepoint-cave-adapter] upload error: ' + (err?.message || err));
        res.status(502).json({ error: err?.message || 'SharePoint error' });
      }
    });

    app.get(basePath + '/stream/:driveId/:itemId', async (req, res) => {
      try {
        const tenant = getTenant(req);
        const token = await getToken(tenant);
        if (!token) return res.status(503).json({ error: 'SharePoint not configured' });
        const { driveId: dId, itemId } = req.params;
        const url = `${GRAPH_BASE}/drives/${dId}/items/${itemId}/content`;
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: 'manual' });
        if (r.status === 302 && r.headers.get('location')) {
          return res.redirect(302, r.headers.get('location'));
        }
        if (!r.ok) return res.status(r.status).send(r.statusText);
        const contentType = r.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        const buf = await r.arrayBuffer();
        res.send(Buffer.from(buf));
      } catch (err) {
        log('warn', '[sharepoint-cave-adapter] stream error: ' + (err?.message || err));
        res.status(502).json({ error: err?.message || 'SharePoint error' });
      }
    });

    app.get(basePath + '/embed-url/:driveId/:itemId', (req, res) => {
      const { driveId: dId, itemId } = req.params;
      const base = (req.protocol + '://' + req.get('host')).replace(/\/$/, '');
      const streamUrl = `${base}${basePath}/stream/${dId}/${itemId}`;
      res.json({ streamUrl, embedUrl: streamUrl });
    });

    log('info', '[sharepoint-cave-adapter] Mounted at ' + basePath);
  }

  return { mount };
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export default { createSharePointCaveAdapter };
