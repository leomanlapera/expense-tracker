import { WebSocket } from "ws";

// Node 20 doesn't ship a native WebSocket. Supabase's realtime client tries to
// construct one on init even when we never subscribe — polyfill so createClient
// doesn't throw. Node 22+ has native WebSocket and this becomes a no-op.
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;
}
