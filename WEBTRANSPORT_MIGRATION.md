# WebTransport Migration Guide

This document describes the migration from REST API calls to WebTransport streaming for connecting to the Go server.

## Quick Start - Easy Win: Item Fetching

The first migration target is **item fetching operations**, which are now supported via WebTransport.

### How to Enable

Add these environment variables to your `.env` file:

```bash
# Enable WebTransport for item operations
VITE_USE_WEBTRANSPORT=true

# Go server WebTransport endpoint (default shown)
VITE_WT_SERVER_URL=https://localhost:443/eq
```

### What's Migrated

- ✅ `getItemById(id)` - Fetch individual items
- ✅ `getAllItems()` - Fetch all items
- ❌ Zone operations (still using REST)
- ❌ NPC operations (still using REST)

### Benefits

1. **Real-time**: WebTransport provides a persistent connection with lower latency
2. **Fallback**: Automatically falls back to REST API if WebTransport fails
3. **Same Interface**: No code changes needed in components using `eqApiService`
4. **Future-ready**: Foundation for migrating other operations

### Architecture

```
React Frontend
    ↓
eqApiService.ts (same interface)
    ↓
webTransportClient.ts (new streaming protocol)
    ↓
Go Server (/eq endpoint)
```

### Protocol Details

The WebTransport client uses:

- Length-prefixed frames for message framing
- JSON message payloads
- Request/response correlation via message types
- Automatic reconnection on disconnect

### Message Format

```typescript
// Request
{
  type: "GET_ITEM",
  itemId: 1001
}

// Response
{
  type: "ITEM_RESPONSE",
  success: true,
  item: { id: 1001, name: "Cloth Cap", ... }
}
```

## Next Migration Targets

1. Zone operations (`getZoneById`, `getAllZones`)
2. NPC operations (`getZoneNPCs`, `getNPCLoot`)
3. Character operations
4. Real-time game events

## Testing

1. Start the Go server (`/server-go`)
2. Set `VITE_USE_WEBTRANSPORT=true` in your environment
3. Open browser dev tools to see WebTransport connection logs
4. Use any item-related functionality in the app

The system will log whether it's using WebTransport or falling back to REST.
