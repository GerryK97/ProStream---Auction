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

    if (!key || !cluster) {
      throw new Error(
        'Missing Pusher client configuration. Please set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER environment variables.'
      );
    }

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
      console.error('[Pusher Client] Connection error:', error);
    });

    pusherClientInstance.connection.bind('unavailable', () => {
      console.warn('[Pusher Client] Connection unavailable');
    });

    pusherClientInstance.connection.bind('failed', () => {
      console.error('[Pusher Client] Connection failed');
    });

    console.log('[Pusher Client] Initialized successfully');
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
