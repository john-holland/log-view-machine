/**
 * Chrome extension messaging adapter for CaveMessagingTransport.
 * Uses chrome.runtime.sendMessage, chrome.runtime.onMessage, chrome.tabs.sendMessage.
 * For use in content, background, or popup script.
 */

import type {
  CaveMessagingTransport,
  CaveMessage,
  MessageTarget,
  MessageSender,
  ExtensionContextType,
} from 'log-view-machine';

export interface ChromeMessagingTransportOptions {
  contextType: ExtensionContextType;
  tabId?: number;
}

function normalizeMessage(
  message: CaveMessage,
  contextType: ExtensionContextType,
  target: MessageTarget
): Record<string, unknown> {
  return {
    type: message.type,
    data: message.data,
    source: message.source ?? contextType,
    target: typeof target === 'string' ? target : { to: target.to, tabId: target.tabId },
    traceId: message.traceId,
  };
}

function toSender(sender: { tab?: { id?: number }; id?: string } | undefined): MessageSender {
  if (!sender) return {};
  return {
    tabId: sender.tab?.id,
    id: sender.id,
  };
}

/**
 * Create a CaveMessagingTransport backed by Chrome extension messaging.
 * - content/popup: send('background', msg) only; onMessage receives from background.
 * - background: send('popup', msg) or send({ to: 'content', tabId }, msg); onMessage receives from content and popup.
 * send() returns a Promise that resolves with the receiver's sendResponse value.
 * Requires chrome.runtime to be available (run in extension context).
 */
export function createChromeMessagingTransport(
  options: ChromeMessagingTransportOptions
): CaveMessagingTransport {
  if (typeof globalThis !== 'undefined' && !(globalThis as any).chrome?.runtime) {
    throw new Error('chrome-messaging-cave-adapter requires chrome.runtime (extension context)');
  }
  const chromeApi = (globalThis as any).chrome as typeof chrome;
  const { contextType, tabId } = options;
  const handlers: Array<
    (message: CaveMessage, sender?: MessageSender) => unknown | Promise<unknown>
  > = [];

  const transport: CaveMessagingTransport = {
    contextType,
    tabId,
    send(target: MessageTarget, message: CaveMessage): Promise<unknown> {
      const payload = normalizeMessage(message, contextType, target);
      if (contextType === 'content' || contextType === 'popup') {
        if (target !== 'background') {
          return Promise.reject(new Error('Content/popup can only send to background'));
        }
        return chromeApi.runtime.sendMessage(payload) as Promise<unknown>;
      }
      if (contextType === 'background') {
        if (target === 'popup') {
          return chromeApi.runtime.sendMessage(payload) as Promise<unknown>;
        }
        if (typeof target === 'object' && target.to === 'content' && target.tabId != null) {
          if (chromeApi.tabs?.sendMessage) {
            return chromeApi.tabs.sendMessage(target.tabId, payload) as Promise<unknown>;
          }
          return Promise.reject(new Error('chrome.tabs.sendMessage not available'));
        }
        return Promise.reject(new Error('Background send target must be "popup" or { to: "content", tabId }'));
      }
      return Promise.reject(new Error('Unknown contextType'));
    },
    onMessage(handler) {
      const listener = (
        message: unknown,
        sender: { tab?: { id?: number }; id?: string },
        sendResponse: (response?: unknown) => void
      ) => {
        const caveMessage = message as CaveMessage;
        const senderInfo = toSender(sender);
        try {
          const result = handler(caveMessage, senderInfo);
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            (result as Promise<unknown>).then(sendResponse).catch((err) => sendResponse({ error: String(err) }));
          } else {
            sendResponse(result);
          }
        } catch (err) {
          sendResponse({ error: String(err) });
        }
        return true;
      };
      chromeApi.runtime.onMessage.addListener(listener);
      return () => {
        chromeApi.runtime.onMessage.removeListener(listener);
      };
    },
  };

  return transport;
}
