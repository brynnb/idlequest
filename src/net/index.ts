// Re-export the EqSocket class and create singleton instances
import { EqSocket } from "./eq-socket";

// Singleton socket instances for world and zone connections
export const WorldSocket = new EqSocket({
  allowReconnect: true,
  maxRetries: 5,
});
export const ZoneSocket = new EqSocket({ allowReconnect: true, maxRetries: 5 });

// Re-export types and utilities
export { EqSocket } from "./eq-socket";
export { OpCodes } from "./opcodes";
export { setStructFields, capnpToPlainObject } from "./capnp-utils";

// Re-export commonly used Cap'n Proto types
export {
  CharCreate,
  Int,
  Spawn,
  Spawns,
  String as CapnpString,
  MoveItem,
  // Data query types
  GetItemRequest,
  GetItemResponse,
  GetZoneRequest,
  GetZoneResponse,
  GetZoneNPCsRequest,
  GetZoneNPCsResponse,
  NPCData,
  GetAdjacentZonesRequest,
  GetAdjacentZonesResponse,
  AdjacentZone,
  SendChatMessageRequest,
  ChatMessageBroadcast,
  DialogueHistoryEntry,
  GetNPCDialogueRequest,
  GetNPCDialogueResponse,
} from "./capnp/common";

export { DeleteItem } from "./capnp/item";

export {
  CharacterSelect,
  CharacterSelectEntry,
  PlayerProfile,
} from "./capnp/player";

export { JWTLogin, JWTResponse, EnterWorld } from "./capnp/world";
export { RequestClientZoneChange } from "./capnp/zone";
