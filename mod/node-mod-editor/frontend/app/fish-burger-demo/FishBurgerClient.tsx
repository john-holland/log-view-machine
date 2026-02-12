'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cave } from 'log-view-machine';

const spelunk = {
  childCaves: {
    'fish-burger-api': {
      route: '/fish-burger-demo',
      tomeId: 'fish-burger-tome',
      tomes: { fishBurger: {} },
    },
  },
};

type State = 'idle' | 'cooking' | 'completed' | 'error';

export default function FishBurgerClient() {
  const [cave, setCave] = useState<ReturnType<typeof Cave> | null>(null);
  const [state, setState] = useState<State>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cookingTime, setCookingTime] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const c = Cave('node-example-frontend', spelunk);
    c.initialize().then(() => setCave(c));
  }, []);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const sendCooking = useCallback(async (event: string, data: Record<string, unknown> = {}) => {
    try {
      const res = await fetch('/api/fish-burger/cooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data: { ...data, orderId, cookingTime, temperature } }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const result = await res.json();
      if (result?.result?.context) {
        const ctx = result.result.context;
        if (ctx.orderId != null) setOrderId(ctx.orderId);
        if (ctx.cookingTime != null) setCookingTime(ctx.cookingTime);
        if (ctx.temperature != null) setTemperature(ctx.temperature);
      }
      const stateVal = result?.result?.value ?? result?.result?.state ?? state;
      setState(stateVal === 'completed' ? 'completed' : stateVal === 'cooking' ? 'cooking' : stateVal === 'idle' ? 'idle' : 'cooking');
      addLog(`Event ${event} OK`);
      return result;
    } catch (e: unknown) {
      addLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setState('error');
      throw e;
    }
  }, [orderId, cookingTime, temperature, state, addLog]);

  const handleStart = useCallback(() => {
    const id = `order-${Date.now()}`;
    setOrderId(id);
    setState('cooking');
    sendCooking('START_COOKING', { orderId: id, ingredients: ['fish', 'bun'] });
  }, [sendCooking]);

  const handleUpdateProgress = useCallback(() => {
    setCookingTime((t) => t + 10);
    setTemperature((t) => Math.min(t + 15, 220));
    sendCooking('UPDATE_PROGRESS', { cookingTime: cookingTime + 10, temperature: Math.min(temperature + 15, 220) });
  }, [cookingTime, temperature, sendCooking]);

  const handleComplete = useCallback(() => {
    sendCooking('COMPLETE_COOKING').then(() => setState('completed'));
  }, [sendCooking]);

  const handleReset = useCallback(() => {
    setState('idle');
    setOrderId(null);
    setCookingTime(0);
    setTemperature(0);
    addLog('Reset');
  }, [addLog]);

  if (!cave) {
    return <p>Loading Cave...</p>;
  }

  const target = cave.getRenderTarget('/fish-burger-demo');

  return (
    <div>
      <h1>Fish Burger Demo (Frontend Cave)</h1>
      <p>Route: {target?.route ?? '-'}, Tome: {target?.tomeId ?? '-'}</p>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong> {state} | Order: {orderId ?? '-'} | Time: {cookingTime}s | Temp: {temperature}°C
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" onClick={handleStart} disabled={state === 'cooking'}>Start Cooking</button>
        <button type="button" onClick={handleUpdateProgress} disabled={state !== 'cooking'}>Update Progress</button>
        <button type="button" onClick={handleComplete} disabled={state !== 'cooking'}>Complete Cooking</button>
        <button type="button" onClick={handleReset}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', maxHeight: 200, overflow: 'auto', background: '#f0f0f0', padding: 8 }}>
        {log.length === 0 ? 'Logs will appear here.' : log.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}
