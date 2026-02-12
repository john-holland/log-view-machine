# Node Example – Frontend (Next.js Cave)

Next.js app that acts as the **frontend Cave build**, talking to the **backend Cave** (Express) via the next-cave-adapter proxy.

## Setup

```bash
npm install
```

## Run

1. Start the backend from `example/node-example`: `npm run dev` (http://localhost:3000).
2. Set the backend URL and start the frontend:

   ```bash
   export BACKEND_CAVE_URL=http://localhost:3000
   npm run dev
   ```

   Frontend runs at http://localhost:3001.

3. Open http://localhost:3001/fish-burger-demo. The page uses Cave and `getRenderTarget()`; events are sent to `/api/fish-burger/cooking` (and similar), which the next-cave-adapter proxies to the backend.

## Environment

- `BACKEND_CAVE_URL` – URL of the Express Cave backend (default `http://localhost:3000`).
