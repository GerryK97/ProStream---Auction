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
        // Enable stats for monitoring (optional)
        enabledTransports: ['ws', 'wss'],
        // Reconnection settings
        activityTimeout: 30000, // 30 seconds
        pongTimeout: 10000, // 10 seconds
      });

      // Connection state logging
      pusherClientInstance.connection.bind('connected', () => {
        console.log('[Pusher Client] Connected successfully');
      });

      pusherClientInstance.connection.bind('disconnected', () => {
        console.log('[Pusher Client] Disconnected');
      });

      pusherClientInstance.connection.bind('error', (error: any) => {
        if (!error || Object.keys(error).length === 0) return;
        if (error.type === 'WebSocketError') {
          console.warn('[Pusher Client] WebSocket error:', error.error);
        } else if (error.type === 'PusherError') {
          if (!error.data || Object.keys(error.data).length === 0) return;
          console.error('[Pusher Client] Pusher error:', error.data);
        } else {
          console.error('[Pusher Client] Connection error:', error);
        }
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
