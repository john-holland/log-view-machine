'use client';

import { useEffect, useState } from 'react';

const API_BASE = typeof window !== 'undefined' ? '' : process.env.BACKEND_CAVE_URL || 'http://localhost:3000';

type PresenceEntry = { user: string; location?: string; at?: string };
type ModEntry = { id: string; name?: string; description?: string };

export default function FeaturesPage() {
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);
  const [loginStatus, setLoginStatus] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchPresence = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/editor/presence?caveOrTomeId=features-tome`, { credentials: 'include' });
      const list = r.ok ? await r.json() : [];
      setPresence(Array.isArray(list) ? list : []);
    } catch {
      setPresence([]);
    }
  };

  const fetchMods = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/mods`, { credentials: 'include' });
      const data = r.ok ? await r.json() : { mods: [] };
      setMods(Array.isArray(data.mods) ? data.mods : []);
    } catch {
      setMods([]);
    }
  };

  const updatePresence = async (user: string, location: string) => {
    try {
      await fetch(`${API_BASE}/api/editor/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user, location }),
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all([fetchPresence(), fetchMods()]);
      if (mounted) setLoading(false);
    })();
    const t = setInterval(fetchPresence, 15000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus('');
    try {
      const r = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.success) {
        setUser(data.user || { username });
        setLoginStatus(`Logged in as ${data.user?.username || data.user?.email || 'user'}`);
        const who = data.user?.username || data.user?.email || username;
        await updatePresence(who, 'features-tome');
        fetchMods();
        fetchPresence();
      } else {
        setLoginStatus(data.error || 'Login failed');
      }
    } catch {
      setLoginStatus('Request failed');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Features</h1>

      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f5f5f5', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1em' }}>Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 18px', borderRadius: 8, background: '#667eea', color: 'white', border: 'none', cursor: 'pointer' }}>
            Log in
          </button>
          {loginStatus && <span style={{ marginLeft: 8, fontSize: 14, color: '#333' }}>{loginStatus}</span>}
        </form>
      </section>

      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f5f5f5', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1em' }}>Who&apos;s here</h2>
        {loading ? (
          <p style={{ margin: 0, color: '#666' }}>Loading…</p>
        ) : presence.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {presence.map((p, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                }}
              >
                {p.user}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#666' }}>No one yet</p>
        )}
      </section>

      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f5f5f5', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1em' }}>Mods</h2>
        {loading ? (
          <p style={{ margin: 0, color: '#666' }}>Loading…</p>
        ) : mods.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mods.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 14,
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 10,
                  border: '1px solid #eee',
                }}
              >
                <strong>{m.name || m.id}</strong>
                {m.description && <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555' }}>{m.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#666' }}>No mods for your account. Log in to see mods assigned to you.</p>
        )}
      </section>
    </div>
  );
}
