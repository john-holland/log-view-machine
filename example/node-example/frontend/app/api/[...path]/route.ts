import { createProxyHandler } from 'next-cave-adapter';

const proxy = createProxyHandler({
  backendCaveUrl: process.env.BACKEND_CAVE_URL || 'http://localhost:3000',
  registryPath: '/api/registry',
});

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxy(request, { path: params.path });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxy(request, { path: params.path });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxy(request, { path: params.path });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxy(request, { path: params.path });
}
