/**
 * Library API router: search, upload, get document, download.
 * Requires auth (caller must attach requireLibraryAuth or check getCurrentUser).
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getContinuumDb, ensureLibrarySchema, librarySearch, libraryGet, libraryInsert, getUploadsDir } from './continuum-library.js';

const router = express.Router();

const uploadsDir = getUploadsDir();
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = Date.now().toString(36) + path.extname(file.originalname || '') || '.bin';
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

router.get('/search', async (req, res) => {
  try {
    const document_type = req.query.document_type || undefined;
    const q = req.query.q || undefined;
    const lat = req.query.lat != null ? parseFloat(req.query.lat) : undefined;
    const lon = req.query.lon != null ? parseFloat(req.query.lon) : undefined;
    const distance_mi = req.query.distance_mi;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const rows = await librarySearch({ document_type, q, lat, lon, distance_mi, limit });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const loginAdapter = req.loginAdapter;
  const user = loginAdapter ? loginAdapter.getCurrentUser(req) : null;
  if (!user) return res.status(401).json({ error: 'Login required' });
  try {
    const owner_id = user.id || user.username || user.email;

    let body = req.body || {};
    if (typeof body.document_type !== 'string') {
      return res.status(400).json({ error: 'document_type is required' });
    }
    const document_type = body.document_type.trim().toLowerCase();
    if (!['video', 'document', 'audio', 'image', 'program', 'data'].includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document_type' });
    }

    let blob_ref = null;
    if (req.file && req.file.path) {
      blob_ref = path.basename(req.file.path);
    }
    const url = typeof body.url === 'string' ? body.url.trim() || null : null;
    let type_metadata = body.type_metadata;
    if (typeof type_metadata === 'string') {
      try {
        type_metadata = JSON.parse(type_metadata);
      } catch (_) {
        type_metadata = {};
      }
    }
    if (typeof type_metadata !== 'object' || type_metadata === null) type_metadata = {};
    const lat = body.lat != null ? parseFloat(body.lat) : null;
    const lon = body.lon != null ? parseFloat(body.lon) : null;
    const altitude_m = body.altitude_m != null ? parseFloat(body.altitude_m) : null;

    const id = await libraryInsert({
      document_type,
      blob_ref,
      url,
      type_metadata,
      owner_id,
      lat: Number.isNaN(lat) ? null : lat,
      lon: Number.isNaN(lon) ? null : lon,
      altitude_m: Number.isNaN(altitude_m) ? null : altitude_m,
    });
    res.status(201).json({ id, url: url || (id ? `/api/library/documents/${id}/download` : null) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.get('/documents/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await libraryGet(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed' });
  }
});

router.get('/documents/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await libraryGet(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.url && !row.blob_ref) {
      return res.redirect(302, row.url);
    }
    if (!row.blob_ref) return res.status(404).json({ error: 'No file' });
    const filePath = path.join(uploadsDir, row.blob_ref);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.sendFile(path.resolve(filePath), { headers: { 'Content-Disposition': 'attachment' } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

export { router as libraryRouter };
