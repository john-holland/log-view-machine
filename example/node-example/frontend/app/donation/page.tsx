'use client';

import type { SlotProps } from '../slot-registry';

/**
 * Donation page: mod author donation and sticky coins (Solana).
 * Placeholder for @solana/wallet-adapter connect + SPL transfer.
 * Uses same Cave/getRenderTarget pattern; donation-tome holds wallet/amount state.
 */
export default function DonationPage(_props?: SlotProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <h1>Donation &amp; Sticky Coins</h1>
      <p>Support mod authors with Solana. Connect your wallet to send SPL/SOL.</p>
      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
        <p><strong>Connect wallet</strong> (placeholder — add @solana/wallet-adapter-react)</p>
        <p>After connect: choose amount, send to mod-author address from mod metadata.</p>
      </div>
      <p style={{ marginTop: '1rem', fontSize: 14, color: '#666' }}>
        Sticky-coins state is persisted via duckdb-cavedb-adapter (donation-tome).
      </p>
    </div>
  );
}
