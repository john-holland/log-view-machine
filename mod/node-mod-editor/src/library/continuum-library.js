/**
 * Continuum library_documents access for Cave server.
 * Uses same schema as unified_semantic_archiver (library_documents table).
 * Requires CONTINUUM_DB_PATH; optional CONTINUUM_LIBRARY_UPLOADS for file storage.
 */

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEOHASH_ALPHABET = '0123456789bcdefghjkmnopqrstuvwxyz';
const EARTH_RADIUS_MI = 3958.8;

function geohashEncode(lat, lon, precision = 7) {
  let latLo = -90, latHi = 90, lonLo = -180, lonHi = 180;
  let bits = 0, bit = 0;
  const result = [];
  while (result.length < precision) {
    if (bit % 2 === 0) {
      const mid = (lonLo + lonHi) / 2;
      if (lon >= mid) { lonLo = mid; bits = (bits << 1) + 1; }
      else { lonHi = mid; bits <<= 1; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat >= mid) { latLo = mid; bits = (bits << 1) + 1; }
      else { latHi = mid; bits <<= 1; }
    }
    bit++;
    if (bit === 5) {
      result.push(GEOHASH_ALPHABET[bits]);
      bits = 0;
      bit = 0;
    }
  }
  return result.join('');
}

function haversineMi(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const a = toRad(lat2 - lat1);
  const b = toRad(lon2 - lon1);
  const x = Math.sin(a / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(b / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(Math.min(1, x)));
}

const LIBRARY_DOCUMENTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS library_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL CHECK (document_type IN ('video','document','audio','image','program','data')),
  blob_ref TEXT,
  url TEXT,
  type_metadata TEXT,
  owner_id TEXT,
  lat REAL,
  lon REAL,
  altitude_m REAL,
  geohash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_library_documents_type ON library_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_library_documents_geohash ON library_documents(geohash);
CREATE INDEX IF NOT EXISTS idx_library_documents_owner ON library_documents(owner_id);
`;

let continuumKnex = null;

export function getContinuumDb() {
  const dbPath = process.env.CONTINUUM_DB_PATH;
  if (!dbPath) return null;
  if (continuumKnex) return continuumKnex;
  const connectionPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  continuumKnex = knex({
    client: 'sqlite3',
    connection: { filename: connectionPath },
    useNullAsDefault: true,
  });
  return continuumKnex;
}

export async function ensureLibrarySchema(knexInstance) {
  const statements = LIBRARY_DOCUMENTS_SCHEMA.trim().split(';').filter(Boolean);
  for (const stmt of statements) {
    await knexInstance.raw(stmt);
  }
}

export async function librarySearch(options = {}) {
  const { document_type, q, lat, lon, distance_mi, limit = 100 } = options;
  const db = getContinuumDb();
  if (!db) return [];
  await ensureLibrarySchema(db);
  let query = db('library_documents').select('*').orderBy('id', 'desc');
  if (document_type) query = query.where('document_type', document_type);
  if (q && typeof q === 'string' && q.trim()) {
    const like = `%${q.trim()}%`;
    query = query.where((b) => b.where('type_metadata', 'like', like).orWhere('url', 'like', like));
  }
  let rows = await query.limit(limit * 2);
  if (lat != null && lon != null && distance_mi != null && distance_mi !== 'infinite') {
    const dist = parseFloat(distance_mi);
    if (!Number.isNaN(dist)) {
      if (dist === 0) {
        const bucket = geohashEncode(Number(lat), Number(lon), 7);
        rows = rows.filter((r) => r.geohash === bucket);
      } else {
        rows = rows.filter((r) => {
          if (r.lat == null || r.lon == null) return false;
          return haversineMi(Number(lat), Number(lon), Number(r.lat), Number(r.lon)) <= dist;
        });
      }
    }
  }
  return rows.slice(0, limit);
}

export async function libraryGet(id) {
  const db = getContinuumDb();
  if (!db) return null;
  await ensureLibrarySchema(db);
  const row = await db('library_documents').where('id', id).first();
  return row || null;
}

export async function libraryInsert(row) {
  const db = getContinuumDb();
  if (!db) throw new Error('Continuum DB not configured (CONTINUUM_DB_PATH)');
  await ensureLibrarySchema(db);
  const { document_type, blob_ref, url, type_metadata, owner_id, lat, lon, altitude_m } = row;
  let geohash = null;
  if (lat != null && lon != null) {
    geohash = geohashEncode(Number(lat), Number(lon), 7);
  }
  const typeMetaStr = typeof type_metadata === 'object' ? JSON.stringify(type_metadata) : type_metadata;
  await db('library_documents').insert({
    document_type,
    blob_ref: blob_ref ?? null,
    url: url ?? null,
    type_metadata: typeMetaStr ?? null,
    owner_id: owner_id ?? null,
    lat: lat != null ? Number(lat) : null,
    lon: lon != null ? Number(lon) : null,
    altitude_m: altitude_m != null ? Number(altitude_m) : null,
    geohash,
  });
  const row = await db('library_documents').orderBy('id', 'desc').first();
  return row ? row.id : null;
}

export function getUploadsDir() {
  const dir = process.env.CONTINUUM_LIBRARY_UPLOADS || path.join(process.cwd(), 'data', 'library_uploads');
  return dir;
}
