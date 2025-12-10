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
export { CharCreate, Int, Spawn, Spawns } from "./capnp/common";

export {
  CharacterSelect,
  CharacterSelectEntry,
  PlayerProfile,
} from "./capnp/player";

export { JWTLogin, JWTResponse } from "./capnp/world";
