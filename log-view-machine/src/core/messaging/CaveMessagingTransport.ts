/**
 * CaveMessagingTransport - Abstract messaging for Cave in extension contexts
 * (content, background, popup). Enables communication without Chrome API cruft.
 * See docs/ARCHITECTURE_AND_CAVE.md and chrome-messaging-cave-adapter.
 */

export type ExtensionContextType = 'content' | 'background' | 'popup';

export type MessageTarget =
  | 'background'
  | 'popup'
  | { to: 'content'; tabId: number };

export interface CaveMessage {
  type: string;
  data?: unknown;
  source?: ExtensionContextType;
  target?: MessageTarget;
  traceId?: string;
}

export interface MessageSender {
  tabId?: number;
  id?: string;
}

export interface CaveMessagingTransport {
  readonly contextType: ExtensionContextType;
  readonly tabId?: number;
  send(target: MessageTarget, message: CaveMessage): Promise<unknown>;
  onMessage(
    handler: (
      message: CaveMessage,
      sender?: MessageSender
    ) => unknown | Promise<unknown>
  ): () => void;
}

export interface InMemoryTransportOptions {
  contextType: ExtensionContextType;
  tabId?: number;
  /** Optional peer transport for request/response; when set, send() delivers to peer's handler. */
  peer?: CaveMessagingTransport;
}

/**
 * Create an in-memory transport (sensible default for tests and non-extension).
 * When peer is set, send(target, message) delivers to the peer's onMessage handler
 * and resolves with the handler's return value. When no peer or no handler, resolves with {}.
 */
export function createInMemoryTransport(
  options: InMemoryTransportOptions
): CaveMessagingTransport {
  const { contextType, tabId } = options;
  let peer: CaveMessagingTransport | null = options.peer ?? null;
  const handlers: Array<
    (message: CaveMessage, sender?: MessageSender) => unknown | Promise<unknown>
  > = [];

  const transport: CaveMessagingTransport = {
    contextType,
    tabId,
    send(target: MessageTarget, message: CaveMessage): Promise<unknown> {
      const normalized: CaveMessage = {
        ...message,
        source: message.source ?? contextType,
        target: message.target ?? target,
      };
      if (peer && '__invokeHandler' in peer) {
        return Promise.resolve((peer as InMemoryTransportPeer).__invokeHandler(normalized, { id: contextType, tabId }));
      }
      return Promise.resolve({});
    },
    onMessage(handler) {
      handlers.push(handler);
      return () => {
        const i = handlers.indexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      };
    },
  };

  const peerRef = transport as InMemoryTransportPeer;
  peerRef.__invokeHandler = (message: CaveMessage, sender: MessageSender): unknown => {
    if (handlers.length === 0) return {};
    const h = handlers[handlers.length - 1];
    return h(message, sender);
  };
  peerRef.__setPeer = (p: CaveMessagingTransport): void => {
    peer = p;
  };

  if (options.peer && '__setPeer' in options.peer) {
    (options.peer as InMemoryTransportPeer).__setPeer(transport);
    peer = options.peer;
  }

  return transport;
}

interface InMemoryTransportPeer extends CaveMessagingTransport {
  __invokeHandler(message: CaveMessage, sender: MessageSender): unknown | Promise<unknown>;
  __setPeer(p: CaveMessagingTransport): void;
}

/** Wire two in-memory transports as peers so send() on one invokes the other's handler. */
export function wireInMemoryTransportPair(
  a: CaveMessagingTransport,
  b: CaveMessagingTransport
): void {
  if ('__setPeer' in a) (a as InMemoryTransportPeer).__setPeer(b);
  if ('__setPeer' in b) (b as InMemoryTransportPeer).__setPeer(a);
}
