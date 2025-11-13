import React, { useState, useEffect } from 'react';
import { TomeBase } from './TomeBase';
import { ViewStateMachine } from './ViewStateMachine';

/**
 * Common tome rendering pattern that provides:
 * - View key subscription for React data pump
 * - Single point of truth via tome.render()
 * - Loading state fallback
 */
export const useTomeRenderer = (tome: TomeBase | ViewStateMachine<any>) => {
  const isTomeBase = tome instanceof TomeBase;
  const [viewKey, setViewKey] = useState(isTomeBase ? tome.getViewKey() : 'initial');
  const [renderedView, setRenderedView] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (isTomeBase) {
      const unsubscribe = tome.observeViewKey(setViewKey);
      return unsubscribe;
    }
  }, [tome, isTomeBase]);

  useEffect(() => {
    if (isTomeBase) {
      const view = tome.render() || null;
      setRenderedView(view);
    } else {
      // ViewStateMachine.render requires a model parameter
      // For now, render an empty view or handle differently
      setRenderedView(null);
    }
  }, [viewKey, tome, isTomeBase]);

  return renderedView || <div>Loading...</div>;
};

/**
 * TomeRenderer component wrapper for easier usage
 */
export interface TomeRendererProps {
  tome: TomeBase | ViewStateMachine<any>;
  loadingComponent?: React.ReactNode;
  children?: (renderedView: React.ReactNode) => React.ReactNode;
}

export const TomeRenderer: React.FC<TomeRendererProps> = ({ 
  tome, 
  loadingComponent = <div>Loading...</div>,
  children 
}) => {
  const renderedView = useTomeRenderer(tome);

  if (children) {
    return <>{children(renderedView)}</>;
  }

  return <>{renderedView || loadingComponent}</>;
};

export default TomeRenderer;
