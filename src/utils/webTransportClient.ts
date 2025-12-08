// In local dev, we fetch the cert hash from /api/hash and connect to https://127.0.0.1/eq
// In production, we use the configured URL without pinning
const IS_LOCAL_DEV = import.meta.env.VITE_LOCAL_DEV === "true";
const WT_SERVER_URL =
  import.meta.env.VITE_WT_SERVER_URL ||
  (IS_LOCAL_DEV ? "https://127.0.0.1/eq" : "https://localhost:8443/eq");

// Optional cert pinning env var (fallback if not fetching dynamically)
const WT_CERT_HASH_B64 = import.meta.env.VITE_WT_CERT_HASH as
  | string
  | undefined;

function b64ToBytes(b64: string): Uint8Array {
  try {
    // atob expects standard base64; handle URL-safe if present
    const normalized = b64.trim().replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(normalized);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

export interface WebTransportMessage {
  type: string;
  payload: any;
}

export interface ItemRequest {
  type: "GET_ITEM";
  itemId: number;
}

export interface ItemsRequest {
  type: "GET_ALL_ITEMS";
}

export interface ItemResponse {
  type: "ITEM_RESPONSE";
  success: boolean;
  item?: any;
  error?: string;
}

export interface ItemsResponse {
  type: "ITEMS_RESPONSE";
  success: boolean;
  items?: any[];
  error?: string;
}

export interface CharacterRequest {
  type: "GET_CHARACTER";
  characterName?: string;
  characterId?: number;
  accountId?: number;
}

export interface CharacterResponse {
  type: "CHARACTER_RESPONSE";
  success: boolean;
  character?: any;
  error?: string;
}

export interface CharactersRequest {
  type: "GET_CHARACTERS";
  accountId: number;
}

export interface CharactersResponse {
  type: "CHARACTERS_RESPONSE";
  success: boolean;
  characters?: any[];
  error?: string;
}

export interface ChatMessage {
  type: "CHAT_MESSAGE";
  text: string;
  messageType: string;
  timestamp?: number;
}

export interface ChatMessageRequest {
  type: "SEND_CHAT_MESSAGE";
  text: string;
  messageType: string;
}

export interface ZoneRequest {
  type: "GET_ZONE" | "GET_ALL_ZONES" | "GET_ZONE_NPCS";
  zoneId?: number;
  zoneidnumber?: number;
  zoneName?: string;
}

export interface ZoneResponse {
  type: "ZONE_RESPONSE";
  success: boolean;
  zone?: any;
  error?: string;
}

export interface ZonesResponse {
  type: "ZONES_RESPONSE";
  success: boolean;
  zones?: any[];
  error?: string;
}

export interface ZoneNPCsResponse {
  type: "ZONE_NPCS_RESPONSE";
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  npcs?: any[];
  error?: string;
}

// Debug event types for the debug panel
export type DebugEventKind = "state" | "send" | "receive";
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface DebugEvent {
  kind: DebugEventKind;
  timestamp: number;
  state?: ConnectionState;
  error?: string;
  message?: unknown;
}

class WebTransportClient {
  private transport: WebTransport | null = null;
  private controlStream: WebTransportBidirectionalStream | null = null;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private chatMessageCallbacks: ((message: ChatMessage) => void)[] = [];
  private debugCallbacks: ((event: DebugEvent) => void)[] = [];

  // Subscribe to debug events for the debug panel
  onDebug(callback: (event: DebugEvent) => void): () => void {
    this.debugCallbacks.push(callback);
    return () => {
      const index = this.debugCallbacks.indexOf(callback);
      if (index > -1) {
        this.debugCallbacks.splice(index, 1);
      }
    };
  }

  private emitDebug(event: Omit<DebugEvent, "timestamp">): void {
    const fullEvent: DebugEvent = { ...event, timestamp: Date.now() };
    this.debugCallbacks.forEach((cb) => {
      try {
        cb(fullEvent);
      } catch (e) {
        console.error("Debug callback error:", e);
      }
    });
  }

  // Get current connection state
  getConnectionState(): ConnectionState {
    if (this.connectPromise) return "connecting";
    if (this.isConnected) return "connected";
    return "disconnected";
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    // If a connection is already in progress, wait for it.
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromise = (async () => {
      this.emitDebug({ kind: "state", state: "connecting" });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opts: any = {};
        let serverUrl = WT_SERVER_URL;

        // In local dev mode, fetch the cert hash from /api/hash (like eqrequiem)
        // Vite proxies /api/hash to the Go server's HTTP hash endpoint on port 7100
        if (IS_LOCAL_DEV) {
          try {
            // Fetch hash from Vite proxy (same origin, avoids CORS/TLS issues)
            const hashResponse = await fetch("/api/hash");
            if (hashResponse.ok) {
              const hashB64 = await hashResponse.text();
              const hash = b64ToBytes(hashB64);
              if (hash.length === 32) {
                opts.serverCertificateHashes = [
                  { algorithm: "sha-256", value: hash.buffer },
                ];
                console.info(
                  "WebTransport: fetched cert hash from /api/hash, using serverCertificateHashes"
                );
              } else {
                console.warn(
                  "WebTransport: /api/hash returned invalid hash length",
                  hash.length
                );
              }
            } else {
              console.warn(
                "WebTransport: failed to fetch /api/hash:",
                hashResponse.status
              );
            }
          } catch (fetchErr) {
            console.warn("WebTransport: could not fetch /api/hash:", fetchErr);
          }
          // WebTransport (HTTP/3 over QUIC) now runs on port 443 (like eqrequiem)
          serverUrl = "https://127.0.0.1/eq";
        } else if (WT_CERT_HASH_B64) {
          // Fallback: use env var if provided (non-local-dev)
          const hash = b64ToBytes(WT_CERT_HASH_B64);
          if (hash.length === 32) {
            opts.serverCertificateHashes = [
              { algorithm: "sha-256", value: hash.buffer },
            ];
            console.info(
              "WebTransport: using serverCertificateHashes from env (sha-256, 32 bytes)"
            );
          } else {
            console.warn(
              "WebTransport: VITE_WT_CERT_HASH present but not a 32-byte SHA-256 (base64)",
              WT_CERT_HASH_B64
            );
            console.info("WebTransport: no certificate pinning configured");
          }
        } else {
          console.info("WebTransport: no certificate pinning configured");
        }

        console.info("WebTransport: connecting", serverUrl);
        this.transport = new WebTransport(serverUrl, opts);
        this.transport.closed.then(
          () => console.warn("WebTransport: closed"),
          (err) => console.error("WebTransport: closed with error", err)
        );
        await this.transport.ready;

        // Open control stream
        this.controlStream = await this.transport.createBidirectionalStream();
        this.isConnected = true;

        // Start reading responses
        this.startReading();

        this.emitDebug({ kind: "state", state: "connected" });
        console.log("WebTransport connected to Go server");
      } catch (error) {
        this.emitDebug({ kind: "state", state: "error", error: String(error) });
        console.error("Failed to connect to WebTransport server:", error);
        throw error;
      } finally {
        this.connectPromise = null;
      }
    })();

    await this.connectPromise;
  }

  private async startReading(): Promise<void> {
    if (!this.controlStream) return;

    const reader = this.controlStream.readable.getReader();
    const textDecoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Parse length-prefixed frame
        const dataView = new DataView(value.buffer);
        const length = dataView.getUint32(0, true); // little endian
        const payloadBytes = value.slice(4, 4 + length);
        const payloadStr = textDecoder.decode(payloadBytes);

        try {
          const response = JSON.parse(payloadStr) as WebTransportMessage;
          this.emitDebug({ kind: "receive", message: response });
          this.handleResponse(response);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
        }
      }
    } catch (error) {
      console.error("Error reading from control stream:", error);
      this.handleDisconnect();
    }
  }

  private handleResponse(response: WebTransportMessage): void {
    // Handle chat messages differently - they're broadcast events, not request responses
    if (response.type === "CHAT_MESSAGE") {
      const chatMessage = response as ChatMessage;
      this.chatMessageCallbacks.forEach((callback) => {
        try {
          callback(chatMessage);
        } catch (error) {
          console.error("Error in chat message callback:", error);
        }
      });
      return;
    }

    // Generate a request ID based on response type and payload
    const requestId = this.generateRequestId(response);
    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(requestId);

      if (response.type.endsWith("_RESPONSE")) {
        const typedResponse = response as ItemResponse;
        if (typedResponse.success) {
          pendingRequest.resolve(typedResponse.item || typedResponse.payload);
        } else {
          pendingRequest.reject(
            new Error(typedResponse.error || "Request failed")
          );
        }
      } else {
        pendingRequest.resolve(response.payload);
      }
    }
  }

  private generateRequestId(response: WebTransportMessage): string {
    if (response.type === "ITEM_RESPONSE") {
      const itemResponse = response as ItemResponse;
      return `GET_ITEM_${itemResponse.item?.id || "unknown"}`;
    }
    if (response.type === "ITEMS_RESPONSE") {
      return "GET_ALL_ITEMS";
    }
    if (response.type === "CHARACTER_RESPONSE") {
      const characterResponse = response as CharacterResponse;
      return `GET_CHARACTER_${
        characterResponse.character?.name ||
        characterResponse.character?.id ||
        "unknown"
      }`;
    }
    if (response.type === "CHARACTERS_RESPONSE") {
      return "GET_CHARACTERS";
    }
    if (response.type === "ZONE_RESPONSE") {
      const zoneResponse = response as ZoneResponse;
      return `GET_ZONE_${zoneResponse.zone?.zoneidnumber || "unknown"}`;
    }
    if (response.type === "ZONES_RESPONSE") {
      return "GET_ALL_ZONES";
    }
    if (response.type === "ZONE_NPCS_RESPONSE") {
      return "GET_ZONE_NPCS";
    }
    if (response.type === "CHAT_MESSAGE") {
      // Chat messages are broadcasted, not responses to requests
      return `CHAT_MESSAGE_${Date.now()}`;
    }
    return response.type;
  }

  private async sendMessage(message: WebTransportMessage): Promise<any> {
    if (!this.isConnected || !this.controlStream) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestIdFromMessage(message);
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("Request timeout"));
      }, 10000); // 10 second timeout

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Emit debug event for sent message
      this.emitDebug({ kind: "send", message });

      // Send message with length prefix
      const payloadStr = JSON.stringify(message);
      const payloadBytes = new TextEncoder().encode(payloadStr);
      const lengthBytes = new Uint8Array(4);
      new DataView(lengthBytes.buffer).setUint32(0, payloadBytes.length, true);

      const frame = new Uint8Array(4 + payloadBytes.length);
      frame.set(lengthBytes, 0);
      frame.set(payloadBytes, 4);

      const writer = this.controlStream!.writable.getWriter();
      writer.write(frame).then(() => writer.releaseLock());
    });
  }

  private generateRequestIdFromMessage(message: WebTransportMessage): string {
    if (message.type === "GET_ITEM") {
      const itemRequest = message as ItemRequest;
      return `GET_ITEM_${itemRequest.itemId}`;
    }
    if (message.type === "GET_ALL_ITEMS") {
      return "GET_ALL_ITEMS";
    }
    if (message.type === "GET_CHARACTER") {
      const characterRequest = message as CharacterRequest;
      return `GET_CHARACTER_${
        characterRequest.characterName ||
        characterRequest.characterId ||
        "unknown"
      }`;
    }
    if (message.type === "GET_CHARACTERS") {
      return "GET_CHARACTERS";
    }
    if (message.type === "GET_ZONE") {
      const zoneRequest = message as ZoneRequest;
      return `GET_ZONE_${zoneRequest.zoneidnumber || "unknown"}`;
    }
    if (message.type === "GET_ALL_ZONES") {
      return "GET_ALL_ZONES";
    }
    if (message.type === "GET_ZONE_NPCS") {
      return "GET_ZONE_NPCS";
    }
    if (message.type === "SEND_CHAT_MESSAGE") {
      return `SEND_CHAT_MESSAGE_${Date.now()}`;
    }
    return message.type;
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.transport = null;
    this.controlStream = null;

    // Reject all pending requests
    for (const [, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection lost"));
    }
    this.pendingRequests.clear();

    this.emitDebug({ kind: "state", state: "disconnected" });
    console.log("WebTransport disconnected");
  }

  async getItemById(id: number): Promise<any> {
    const request: ItemRequest = {
      type: "GET_ITEM",
      itemId: id,
    };

    return this.sendMessage(request);
  }

  async getAllItems(): Promise<any[]> {
    const request: ItemsRequest = {
      type: "GET_ALL_ITEMS",
    };

    return this.sendMessage(request);
  }

  async getCharacterByName(characterName: string): Promise<any> {
    const request: CharacterRequest = {
      type: "GET_CHARACTER",
      characterName,
    };

    return this.sendMessage(request);
  }

  async getCharacterById(characterId: number): Promise<any> {
    const request: CharacterRequest = {
      type: "GET_CHARACTER",
      characterId,
    };

    return this.sendMessage(request);
  }

  async getCharactersByAccountId(accountId: number): Promise<any[]> {
    const request: CharactersRequest = {
      type: "GET_CHARACTERS",
      accountId,
    };

    return this.sendMessage(request);
  }

  async getAllZones(): Promise<any[]> {
    const request: ZoneRequest = {
      type: "GET_ALL_ZONES",
    };

    return this.sendMessage(request);
  }

  async getZoneById(zoneId: number): Promise<any> {
    const request: ZoneRequest = {
      type: "GET_ZONE",
      zoneId,
    };

    return this.sendMessage(request);
  }

  async getZoneByZoneId(zoneidnumber: number): Promise<any> {
    const request: ZoneRequest = {
      type: "GET_ZONE",
      zoneidnumber,
    };

    return this.sendMessage(request);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getZoneNPCs(zoneName: string): Promise<any[]> {
    const request: ZoneRequest = {
      type: "GET_ZONE_NPCS",
      zoneName,
    };

    const response = (await this.sendMessage(request)) as ZoneNPCsResponse;
    if (!response.success) {
      throw new Error(response.error || "Failed to get zone NPCs");
    }
    return response.npcs || [];
  }

  async sendChatMessage(
    text: string,
    messageType: string = "say"
  ): Promise<void> {
    const request: ChatMessageRequest = {
      type: "SEND_CHAT_MESSAGE",
      text,
      messageType,
    };

    // Chat messages don't expect a response, so we use a fire-and-forget approach
    if (!this.isConnected || !this.controlStream) {
      await this.connect();
    }

    const payloadStr = JSON.stringify(request);
    const payloadBytes = new TextEncoder().encode(payloadStr);
    const lengthBytes = new Uint8Array(4);
    new DataView(lengthBytes.buffer).setUint32(0, payloadBytes.length, true);

    const frame = new Uint8Array(4 + payloadBytes.length);
    frame.set(lengthBytes, 0);
    frame.set(payloadBytes, 4);

    const writer = this.controlStream!.writable.getWriter();
    await writer.write(frame);
    writer.releaseLock();
  }

  onChatMessage(callback: (message: ChatMessage) => void): () => void {
    this.chatMessageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.chatMessageCallbacks.indexOf(callback);
      if (index > -1) {
        this.chatMessageCallbacks.splice(index, 1);
      }
    };
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      this.transport.close();
      this.handleDisconnect();
    }
  }
}

// Export singleton instance
export const webTransportClient = new WebTransportClient();
