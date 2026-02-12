/**
 * Slot contract and registry for SaaS-style generic editor.
 * Maps container/tomeId to the React component for that slot so products can swap implementations
 * (e.g. fish-burger vs wave-reader library) without changing Cave or backend.
 */

import type { ComponentType } from 'react';

export interface SlotProps {
  path: string;
  route?: string;
  container?: string;
  tomeId?: string;
  [key: string]: unknown;
}

/** Slot contract: component receives path and optional route/container/tomeId from getRenderTarget. */
export type SlotComponent = ComponentType<SlotProps>;

/** Registry: container or tomeId -> component. Used to resolve which component to render for a slot. */
const slotRegistry: Record<string, SlotComponent> = {};

/** Register a component for a slot key (container name or tomeId). */
export function registerSlot(key: string, component: SlotComponent): void {
  slotRegistry[key] = component;
}

/** Get the component for a slot key, or undefined. */
export function getSlotComponent(key: string): SlotComponent | undefined {
  return slotRegistry[key];
}

/** Resolve slot key from getRenderTarget result: prefer container, fallback to tomeId. */
export function getSlotKey(container?: string | null, tomeId?: string | null): string {
  if (container) return container;
  if (tomeId) return tomeId;
  return 'editor';
}
