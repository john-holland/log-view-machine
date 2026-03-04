/**
 * CaveMessagingTransport - Abstract messaging for Cave in extension contexts
 * (content, background, popup). Enables communication without Chrome API cruft.
 * See docs/ARCHITECTURE_AND_CAVE.md and chrome-messaging-cave-adapter.
 */
/**
 * Create an in-memory transport (sensible default for tests and non-extension).
 * When peer is set, send(target, message) delivers to the peer's onMessage handler
 * and resolves with the handler's return value. When no peer or no handler, resolves with {}.
 */
export function createInMemoryTransport(options) {
    const { contextType, tabId } = options;
    let peer = options.peer ?? null;
    const handlers = [];
    const transport = {
        contextType,
        tabId,
        send(target, message) {
            const normalized = {
                ...message,
                source: message.source ?? contextType,
                target: message.target ?? target,
            };
            if (peer && '__invokeHandler' in peer) {
                return Promise.resolve(peer.__invokeHandler(normalized, { id: contextType, tabId }));
            }
            return Promise.resolve({});
        },
        onMessage(handler) {
            handlers.push(handler);
            return () => {
                const i = handlers.indexOf(handler);
                if (i >= 0)
                    handlers.splice(i, 1);
            };
        },
    };
    const peerRef = transport;
    peerRef.__invokeHandler = (message, sender) => {
        if (handlers.length === 0)
            return {};
        const h = handlers[handlers.length - 1];
        return h(message, sender);
    };
    peerRef.__setPeer = (p) => {
        peer = p;
    };
    if (options.peer && '__setPeer' in options.peer) {
        options.peer.__setPeer(transport);
        peer = options.peer;
    }
    return transport;
}
/** Wire two in-memory transports as peers so send() on one invokes the other's handler. */
export function wireInMemoryTransportPair(a, b) {
    if ('__setPeer' in a)
        a.__setPeer(b);
    if ('__setPeer' in b)
        b.__setPeer(a);
}
