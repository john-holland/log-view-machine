import { createTome, createTomeConfig } from '../index';

/** In-memory CaveDB for tests (same shape as duckdb-cavedb-adapter memory impl). */
function memoryCaveDb(tomeId: string) {
  const store = new Map<string, Record<string, unknown>>();
  return {
    tomeId,
    async put(key: string, value: Record<string, unknown> | unknown) {
      const doc =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : { value };
      store.set(key, { ...doc, _id: key });
    },
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async find(selector?: Record<string, unknown>) {
      const all = [...store.values()];
      if (!selector || Object.keys(selector).length === 0) return all;
      return all.filter((d) => Object.entries(selector).every(([k, v]) => d[k] === v));
    },
    async findOne(selector?: Record<string, unknown>) {
      const rows = await this.find(selector);
      return rows[0] ?? null;
    },
    async close() {
      store.clear();
    },
  };
}

async function postCaveRoute(baseUrl: string, envelope: Record<string, unknown>) {
  const url = `${String(baseUrl).replace(/\/$/, '')}/cave/route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  return { ok: res.ok, json };
}

describe('runHandlersOnTransition (editor-style pilot path)', () => {
  it('runs withState on service transition, calls Cave, persists snapshot', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        service: 'resaurce',
        sessionId: 'sess_pilot_test',
      }),
    });
    (global as any).fetch = fetchMock;

    const adapter = memoryCaveDb('resaurce-hr-pilot-tome');
    const config = createTomeConfig({
      id: 'resaurce-hr-pilot-tome',
      machines: {
        hrHelpPilot: {
          id: 'resaurce-hr-help-pilot',
          name: 'HR help pilot',
          runHandlersOnTransition: true,
          defaultModelForTransitionHandlers: {},
          db: adapter,
          xstateConfig: {
            id: 'resaurce-hr-help-pilot',
            initial: 'idle',
            states: {
              idle: { on: { request: 'sessionRequested' } },
              sessionRequested: { on: { chat_created: 'sessionActive', CAVE_FAIL: 'idle' } },
              sessionActive: { on: { RESET: 'idle' } },
            },
          },
          logStates: {
            idle: async () => {},
            sessionRequested: async (ctx) => {
              const tid = 'trace-pilot-test';
              await ctx.log('pilot: calling Cave', { trace_id: tid });
              const { ok, json } = await postCaveRoute('http://test.local', {
                schema_version: '2.0',
                route: 'resaurce:hr/help/request',
                payload: { context: 'jest' },
                trace_id: tid,
                tenant: 'pilot',
                presence: 'pilot',
                reply_mode: 'sync_http',
              });
              if (!ok || json?.ok === false) {
                ctx.send({ type: 'CAVE_FAIL' });
                return;
              }
              if (ctx.db && typeof (ctx.db as any).put === 'function') {
                await (ctx.db as any).put(`snapshot:resaurce-hr-help-pilot:${tid}`, {
                  state: 'sessionActive',
                  trace_id: tid,
                  updatedAt: new Date().toISOString(),
                });
              }
              ctx.send({ type: 'chat_created' });
            },
            sessionActive: async () => {},
          },
        },
      },
    });

    const tome = createTome(config);
    await tome.start();
    const machine = tome.getMachine('hrHelpPilot');
    (machine as any).send({ type: 'request' });
    await new Promise((r) => setTimeout(r, 60));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const stored = await adapter.find({});
    expect(stored.length).toBeGreaterThan(0);
  });
});
