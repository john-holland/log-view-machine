import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Node Example – Cave Frontend',
  description: 'Frontend Cave build talking to backend Cave (Express)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <nav style={{ padding: '1rem 1.5rem', background: '#1a1a2e', color: '#eee' }}>
          <a href="/" style={{ color: '#fff', marginRight: '1rem' }}>Home</a>
          <a href="/features" style={{ color: '#fff', marginRight: '1rem' }}>Features</a>
          <a href="/editor" style={{ color: '#fff' }}>Editor</a>
        </nav>
        <main style={{ padding: '1.5rem' }}>{children}</main>
      </body>
    </html>
  );
}
