# continuum-cave-adapter

Proxies Cave (node-mod-editor) requests to the **continuum** library server so the library API is available under Cave (e.g. for logged-in users or a single origin).

## Env

Set **CONTINUUM_LIBRARY_URL** to the continuum server base URL (e.g. `http://localhost:5050`). When set, the adapter mounts:

- `GET /api/continuum/library/search` → continuum `/api/library/search` (query params forwarded, `X-Tenant-ID` from request)
- `GET /api/continuum/library/documents/:id` → continuum `/api/library/documents/:id`
- `GET /api/continuum/library/documents/:id/download` → continuum download

Tenant is derived from the request (e.g. via `deriveTenantFromRequest` from dotcms-login-adapter) so each Cave request is scoped to the same tenant.

## Usage (node-mod-editor)

The mod wires the adapter when the server starts. No code change needed; set `CONTINUUM_LIBRARY_URL` and (optional) ensure the continuum server is running. Clients can call Cave at `/api/continuum/library/search?lat=40.7&lon=-74` instead of talking to the continuum server directly.

## Optional: embed library UI

To expose the library UI (SPA) from continuum, link to the continuum server (e.g. `CONTINUUM_LIBRARY_URL`) or add an iframe in the Cave frontend that loads that URL.
