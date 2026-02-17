'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Cave } from 'log-view-machine';
import { getSlotComponent, getSlotKey, registerSlot, type SlotProps } from '../../slot-registry';
import dynamic from 'next/dynamic';

const DonationSlot = dynamic(() => import('../../donation/page'), { ssr: false });

function ModSlotPlaceholder({ path, container, tomeId }: SlotProps) {
  return (
    <div>
      <h2>Editor slot</h2>
      <p>Load a mod from the Features page to see content here.</p>
      <p>Path: {path}, container: {container ?? '-'}, tomeId: {tomeId ?? '-'}</p>
      <p><Link href="/features">Go to Features</Link></p>
    </div>
  );
}

function LibraryPlaceholder({ path, container, tomeId }: SlotProps) {
  return (
    <div>
      <h2>Library</h2>
      <p>Path: {path}, container: {container ?? '-'}, tomeId: {tomeId ?? '-'}</p>
      <p>Drop-in: replace this component in the slot registry with a product-specific library.</p>
    </div>
  );
}

function CartPlaceholder({ path, container, tomeId }: SlotProps) {
  return (
    <div>
      <h2>Cart</h2>
      <p>Path: {path}, container: {container ?? '-'}, tomeId: {tomeId ?? '-'}</p>
      <p>Drop-in: replace with fish-burger cart or another cart component.</p>
    </div>
  );
}

// One-time registration (idempotent)
if (typeof getSlotComponent('editor') === 'undefined') {
  registerSlot('editor', ModSlotPlaceholder);
  registerSlot('library', LibraryPlaceholder);
  registerSlot('cart', CartPlaceholder);
  registerSlot('donation', DonationSlot as React.ComponentType<SlotProps>);
  registerSlot('editor-tome', ModSlotPlaceholder);
  registerSlot('library-tome', LibraryPlaceholder);
  registerSlot('cart-tome', CartPlaceholder);
  registerSlot('donation-tome', DonationSlot as React.ComponentType<SlotProps>);
}

const editorSpelunk = {
  childCaves: {
    editor: {
      route: '/editor',
      container: 'editor',
      tomeId: 'editor-tome',
      childCaves: {
        library: { route: '/editor/library', container: 'library', tomeId: 'library-tome' },
        cart: { route: '/editor/cart', container: 'cart', tomeId: 'cart-tome' },
        donation: { route: '/editor/donation', container: 'donation', tomeId: 'donation-tome' },
      },
    },
  },
};

export default function EditorSlotPage() {
  const params = useParams();
  const pathSegments = (params.path as string[] | undefined) ?? [];
  const path = ['editor', ...pathSegments].join('/');
  const [cave, setCave] = useState<ReturnType<typeof Cave> | null>(null);

  useEffect(() => {
    const c = Cave('node-example-frontend-editor', editorSpelunk);
    c.initialize().then(() => setCave(c));
  }, []);

  if (!cave) {
    return <p>Loading...</p>;
  }

  const target = cave.getRenderTarget(path);
  const slotKey = getSlotKey(target?.container, target?.tomeId);
  const SlotComponent = getSlotComponent(slotKey);

  if (!SlotComponent) {
    return (
      <div>
        <p>No slot component for: {slotKey}</p>
        <p>Path: {path}, route: {target?.route}, container: {target?.container}, tomeId: {target?.tomeId}</p>
      </div>
    );
  }

  return (
    <div>
      <SlotComponent
        path={path}
        route={target?.route}
        container={target?.container}
        tomeId={target?.tomeId}
      />
    </div>
  );
}
