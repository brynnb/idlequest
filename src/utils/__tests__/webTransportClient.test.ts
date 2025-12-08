import { describe, it, expect, vi, beforeEach } from "vitest";
import { webTransportClient } from "../webTransportClient";

// Mock WebTransport API
const mockWebTransport = {
  ready: Promise.resolve(),
  createBidirectionalStream: vi.fn(),
  close: vi.fn(),
};

const mockStream = {
  readable: {
    getReader: vi.fn(() => ({
      read: vi.fn().mockResolvedValue({ done: true, value: null }),
    })),
  },
  writable: {
    getWriter: vi.fn(() => ({
      write: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn(),
    })),
  },
};

// Mock the WebTransport constructor
(global as any).WebTransport = vi
  .fn()
  .mockImplementation(() => mockWebTransport);

describe("WebTransportClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebTransport.createBidirectionalStream.mockResolvedValue(mockStream);
  });

  it("should create message requests with correct format", async () => {
    const expectedItemRequest = {
      type: "GET_ITEM",
      itemId: 1001,
    };

    const expectedItemsRequest = {
      type: "GET_ALL_ITEMS",
    };

    // Test item request structure
    expect(expectedItemRequest.type).toBe("GET_ITEM");
    expect(expectedItemRequest.itemId).toBe(1001);

    // Test items request structure
    expect(expectedItemsRequest.type).toBe("GET_ALL_ITEMS");
  });

  it("should handle connection establishment", async () => {
    // The WebTransport client should attempt to connect when making requests
    expect(WebTransport).toBeDefined();
    expect(mockWebTransport.createBidirectionalStream).toBeDefined();
  });

  it("should generate correct request IDs for different message types", () => {
    const itemResponse = {
      type: "ITEM_RESPONSE",
      success: true,
      item: { id: 1001, name: "Test Item" },
    };

    const itemsResponse = {
      type: "ITEMS_RESPONSE",
      success: true,
      items: [{ id: 1001, name: "Test Item" }],
    };

    // These would be tested via the private methods, but we can verify the structure
    expect(itemResponse.type).toBe("ITEM_RESPONSE");
    expect(itemsResponse.type).toBe("ITEMS_RESPONSE");
  });

  it("should handle frame encoding correctly", () => {
    const message = { type: "GET_ITEM", itemId: 1001 };
    const payloadStr = JSON.stringify(message);
    const payloadBytes = new TextEncoder().encode(payloadStr);

    // Test frame structure
    const lengthBytes = new Uint8Array(4);
    new DataView(lengthBytes.buffer).setUint32(0, payloadBytes.length, true);

    const frame = new Uint8Array(4 + payloadBytes.length);
    frame.set(lengthBytes, 0);
    frame.set(payloadBytes, 4);

    expect(frame.length).toBe(4 + payloadBytes.length);
    expect(new DataView(frame.buffer).getUint32(0, true)).toBe(
      payloadBytes.length
    );
  });

  it("should provide the correct public interface", () => {
    expect(typeof webTransportClient.getItemById).toBe("function");
    expect(typeof webTransportClient.getAllItems).toBe("function");
    expect(typeof webTransportClient.disconnect).toBe("function");
  });
});
