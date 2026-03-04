/**
 * CaveMessagingTransport - Abstract messaging for Cave in extension contexts
 * (content, background, popup). Enables communication without Chrome API cruft.
 * See docs/ARCHITECTURE_AND_CAVE.md and chrome-messaging-cave-adapter.
 */
export type ExtensionContextType = 'content' | 'background' | 'popup';
export type MessageTarget = 'background' | 'popup' | {
    to: 'content';
    tabId: number;
};
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
    onMessage(handler: (message: CaveMessage, sender?: MessageSender) => unknown | Promise<unknown>): () => void;
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
export declare function createInMemoryTransport(options: InMemoryTransportOptions): CaveMessagingTransport;
/** Wire two in-memory transports as peers so send() on one invokes the other's handler. */
export declare function wireInMemoryTransportPair(a: CaveMessagingTransport, b: CaveMessagingTransport): void;
//# sourceMappingURL=CaveMessagingTransport.d.ts.map