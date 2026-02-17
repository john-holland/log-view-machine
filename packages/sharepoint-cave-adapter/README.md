# sharepoint-cave-adapter

Cave adapter for **SharePoint** via Microsoft Graph. Upload and download files (e.g. Continuum assets), and expose **stream/embed URLs** so assets can be embedded in SharePoint sites.

## Env

| Env | Description |
|-----|-------------|
| `SHAREPOINT_CLIENT_ID` | Azure AD app (client) ID |
| `SHAREPOINT_TENANT_ID` | Azure AD tenant ID |
| `SHAREPOINT_CLIENT_SECRET` | Azure AD app secret |
| `SHAREPOINT_SITE_ID` | SharePoint site ID (optional if per-tenant provides it) |
| `SHAREPOINT_DRIVE_ID` | SharePoint drive ID (optional; can be resolved from site) |

## Routes

When credentials are set, the adapter mounts under a base path (default `/api/sharepoint`):

- **POST /upload** — Upload a file. Body: JSON `{ "name": "file.pdf", "parentPath": "folder", "content": "<base64>" }` or raw body with query `name`, `parentPath`. Uses Graph direct upload (< 4 MB) or createUploadSession for larger files.
- **GET /stream/:driveId/:itemId** — Stream or redirect to file content. Use as embed `src` or for download.
- **GET /embed-url/:driveId/:itemId** — Returns `{ streamUrl, embedUrl }` for use in SharePoint web parts or iframes.

## Per-tenant OAuth2

Pass **getTenantCredentials(tenantId)** returning `{ clientId, tenantId, clientSecret, siteId?, driveId? }` so each tenant can use a different Azure app and/or site/drive. Use with **getTenantFromRequest(req)** (e.g. `deriveTenantFromRequest` from dotcms-login-adapter).

## Usage (node-mod-editor)

Mount when SharePoint env (or getTenantCredentials) is configured:

```js
import { createSharePointCaveAdapter } from 'sharepoint-cave-adapter';
import { deriveTenantFromRequest } from 'dotcms-login-adapter';

createSharePointCaveAdapter({
  getTenantFromRequest: (req) => deriveTenantFromRequest(req),
  logger,
}).mount(app, '/api/sharepoint');
```

## Continuum integration

Use Continuum (via continuum-cave-adapter) for search and document metadata; use this adapter to upload the same assets to SharePoint and to serve stream URLs so SharePoint pages can embed them (iframe or video/source pointing at `/api/sharepoint/stream/:driveId/:itemId`).
