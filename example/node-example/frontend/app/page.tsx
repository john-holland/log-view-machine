export default function HomePage() {
  return (
    <div>
      <h1>Node Example – Cave Frontend</h1>
      <p>Frontend Cave build (Next.js) talking to backend Cave (Express).</p>
      <ul>
        <li><a href="/fish-burger-demo">Fish Burger Demo</a> – Cave getRenderTarget + per-path Tome API</li>
        <li><a href="/editor">Editor (SaaS slots)</a> – generic editor with fish-burger in editor slot; <a href="/editor/library">library</a>, <a href="/editor/cart">cart</a>, <a href="/editor/donation">donation</a></li>
        <li><a href="/donation">Donation &amp; Sticky Coins</a> – mod author support (Solana placeholder)</li>
      </ul>
    </div>
  );
}
