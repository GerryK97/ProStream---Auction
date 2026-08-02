/**
 * Pusher Client Utility
 *
 * Client-side Pusher instance for subscribing to real-time events.
 * This file provides a singleton Pusher client instance that can be
 * reused across all components to avoid multiple connections.
 */

import PusherJS from 'pusher-js';

// Enable Pusher logging in development
if (process.env.NODE_ENV === 'development') {
  PusherJS.logToConsole = true;
}

// Singleton Pusher client instance
let pusherClientInstance: PusherJS | null = null;

/** True when Pusher fires a noise/empty error payload (common on connect churn). */
function isEmptyPusherPayload(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' || t === '{}' || t === 'null' || t === 'undefined';
  }
  if (typeof value !== 'object') return false;
  try {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return true;
    return keys.every(k => {
      const v = (value as Record<string, unknown>)[k];
      return v == null || v === '' || (typeof v === 'object' && isEmptyPusherPayload(v));
    });
  } catch {
    return true;
  }
}

/**
 * Get or create the Pusher client instance
 */
export function getPusherClient(): PusherJS {
  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    console.log('[Pusher Client] Initializing with:', {
      hasKey: !!key,
      hasCluster: !!cluster,
      key: key ? `${key.substring(0, 10)}...` : 'missing',
      cluster: cluster || 'missing'
    });

    if (!key || !cluster) {
      const error = `Missing Pusher client configuration. NEXT_PUBLIC_PUSHER_KEY: ${key ? 'present' : 'MISSING'}, NEXT_PUBLIC_PUSHER_CLUSTER: ${cluster ? 'present' : 'MISSING'}`;
      console.error('[Pusher Client]', error);
      throw new Error(error);
    }

    try {
      pusherClientInstance = new PusherJS(key, {
        cluster: cluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        // Use generous timeouts — OBS Browser Source runs in a background thread
        // that can be slow to respond to pings. 30s was causing frequent disconnects
        // which left the overlay showing stale state (no re-fetch on reconnect events).
        activityTimeout: 120000, // 2 minutes (Pusher default)
        pongTimeout: 30000,      // 30 seconds (was 10s — too tight for OBS)
      });

      // Connection state logging
      pusherClientInstance.connection.bind('connected', () => {
        console.log('[Pusher Client] Connected successfully');
      });

      pusherClientInstance.connection.bind('disconnected', () => {
        console.log('[Pusher Client] Disconnected');
      });

      pusherClientInstance.connection.bind('error', (error: unknown) => {
        if (isEmptyPusherPayload(error)) return;

        const err = error as {
          type?: string;
          data?: unknown;
          error?: unknown;
        };

        if (err.type === 'WebSocketError') {
          if (isEmptyPusherPayload(err.error)) return;
          console.warn('[Pusher Client] WebSocket error:', err.error);
          return;
        }

        if (err.type === 'PusherError') {
          // Empty `{}` payloads are benign (reconnect / handshake noise).
          if (isEmptyPusherPayload(err.data)) return;
          console.error('[Pusher Client] Pusher error:', err.data);
          return;
        }

        console.error('[Pusher Client] Connection error:', error);
      });

      pusherClientInstance.connection.bind('unavailable', () => {
        console.warn('[Pusher Client] Connection unavailable');
      });

      pusherClientInstance.connection.bind('failed', () => {
        console.error('[Pusher Client] Connection failed');
      });

      console.log('[Pusher Client] Initialized successfully');
    } catch (error) {
      console.error('[Pusher Client] Failed to initialize:', error);
      throw error;
    }
  }

  return pusherClientInstance;
}

/**
 * Get the current connection state
 */
export function getPusherConnectionState(): string {
  const pusher = getPusherClient();
  return pusher.connection.state;
}

/**
 * Check if Pusher is connected
 */
export function isPusherConnected(): boolean {
  const state = getPusherConnectionState();
  return state === 'connected';
}

/**
 * Disconnect Pusher (useful for cleanup)
 */
export function disconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect();
    console.log('[Pusher Client] Disconnected manually');
  }
}

/**
 * Reconnect Pusher
 */
export function reconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.connect();
    console.log('[Pusher Client] Reconnecting...');
  }
}

export default getPusherClient;
