import CharacterProfile from "@entities/CharacterProfile";
import {
  WorldSocket,
  OpCodes,
  GetItemRequest,
  GetItemResponse,
  GetZoneRequest,
  GetZoneResponse,
  GetZoneNPCsRequest,
  GetZoneNPCsResponse,
  GetAdjacentZonesRequest,
  GetAdjacentZonesResponse,
} from "@/net";

export interface Item {
  id: number;
  name: string;
  icon?: number;
  itemclass?: number;
  weight?: number;
  slots?: number;
  price?: number;
  ac?: number;
  damage?: number;
  delay?: number;
  hp?: number;
  mana?: number;
  classes?: number;
  races?: number;
  bagslots?: number;
  bagsize?: number;
  [key: string]: unknown;
}

export interface Zone {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name?: string;
  safe_x?: number;
  safe_y?: number;
  safe_z?: number;
  min_level?: number;
  max_level?: number;
  [key: string]: unknown;
}

export interface NPCType {
  id: number;
  name: string;
  level?: number;
  race?: number;
  class?: number;
  hp?: number;
  gender?: number;
  [key: string]: unknown;
}

class EQDataService {
  async getItemById(id: number): Promise<Item | null> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getItemById");
        return null;
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetItemRequest,
        OpCodes.GetItemResponse,
        GetItemRequest,
        GetItemResponse,
        { itemId: id }
      );
      if (!response.success) {
        console.error("GetItem failed:", response.error);
        return null;
      }
      return {
        id: response.itemId,
        name: response.name,
        icon: response.icon,
        itemclass: response.itemclass,
        weight: response.weight,
        slots: response.slots,
        price: response.price,
        ac: response.ac,
        damage: response.damage,
        delay: response.delay,
        hp: response.hp,
        mana: response.mana,
        classes: response.classes,
        races: response.races,
        bagslots: response.bagslots,
        bagsize: response.bagsize,
      };
    } catch (error) {
      console.error("Error fetching item via Cap'n Proto:", error);
      return null;
    }
  }

  async getAllItems(): Promise<Item[]> {
    // Not implemented - would need a bulk items endpoint
    console.warn("getAllItems not yet implemented with Cap'n Proto");
    return [];
  }

  async getZoneById(id: number): Promise<Zone | null> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getZoneById");
        return null;
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetZoneRequest,
        OpCodes.GetZoneResponse,
        GetZoneRequest,
        GetZoneResponse,
        { zoneId: id, zoneidnumber: 0 }
      );
      if (!response.success) {
        console.error("GetZone failed:", response.error);
        return null;
      }
      return {
        id: response.id,
        zoneidnumber: response.zoneidnumber,
        short_name: response.shortName,
        long_name: response.longName,
        safe_x: response.safeX,
        safe_y: response.safeY,
        safe_z: response.safeZ,
        min_level: response.minLevel,
        max_level: response.maxLevel,
      };
    } catch (error) {
      console.error("Error fetching zone via Cap'n Proto:", error);
      return null;
    }
  }

  async getZoneByZoneId(zoneidnumber: number): Promise<Zone | null> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getZoneByZoneId");
        return null;
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetZoneRequest,
        OpCodes.GetZoneResponse,
        GetZoneRequest,
        GetZoneResponse,
        { zoneId: 0, zoneidnumber: zoneidnumber }
      );
      if (!response.success) {
        console.error("GetZone failed:", response.error);
        return null;
      }
      return {
        id: response.id,
        zoneidnumber: response.zoneidnumber,
        short_name: response.shortName,
        long_name: response.longName,
        safe_x: response.safeX,
        safe_y: response.safeY,
        safe_z: response.safeZ,
        min_level: response.minLevel,
        max_level: response.maxLevel,
      };
    } catch (error) {
      console.error("Error fetching zone via Cap'n Proto:", error);
      return null;
    }
  }

  async getAllZones(): Promise<Zone[]> {
    // Not implemented - would need a bulk zones endpoint
    console.warn("getAllZones not yet implemented with Cap'n Proto");
    return [];
  }

  async getZoneNPCs(zoneName: string): Promise<NPCType[]> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getZoneNPCs");
        return [];
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetZoneNPCsRequest,
        OpCodes.GetZoneNPCsResponse,
        GetZoneNPCsRequest,
        GetZoneNPCsResponse,
        { zoneName }
      );
      if (!response.success) {
        console.error("GetZoneNPCs failed:", response.error);
        return [];
      }
      const npcs: NPCType[] = [];
      for (let i = 0; i < response.npcs.length; i++) {
        const npc = response.npcs.get(i);
        npcs.push({
          id: npc.id,
          name: npc.name,
          level: npc.level,
          race: npc.race,
          class: npc.npcClass,
          hp: npc.hp,
          gender: npc.gender,
        });
      }
      return npcs;
    } catch (error) {
      console.error("Error fetching zone NPCs via Cap'n Proto:", error);
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNPCLoot(_npcId: number): Promise<Item[]> {
    console.warn("getNPCLoot not yet implemented with Cap'n Proto");
    return [];
  }

  async getAdjacentZones(zoneId: number): Promise<Zone[]> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getAdjacentZones");
        return [];
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetAdjacentZonesRequest,
        OpCodes.GetAdjacentZonesResponse,
        GetAdjacentZonesRequest,
        GetAdjacentZonesResponse,
        { zoneId }
      );
      if (!response.success) {
        console.error("GetAdjacentZones failed:", response.error);
        return [];
      }
      const zones: Zone[] = [];
      for (let i = 0; i < response.zones.length; i++) {
        const zone = response.zones.get(i);
        zones.push({
          id: zone.id,
          zoneidnumber: zone.zoneidnumber,
          short_name: zone.shortName,
          long_name: zone.longName,
        });
      }
      return zones;
    } catch (error) {
      console.error("Error fetching adjacent zones via Cap'n Proto:", error);
      return [];
    }
  }

  // Character operations - these use the existing Cap'n Proto flow
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCharacterById(_id: number): Promise<CharacterProfile | null> {
    console.warn("getCharacterById - use PlayerProfile from Cap'n Proto flow");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCharacterByName(_name: string): Promise<CharacterProfile | null> {
    console.warn(
      "getCharacterByName - use PlayerProfile from Cap'n Proto flow"
    );
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCharactersByAccountId(
    _accountId: number
  ): Promise<CharacterProfile[]> {
    console.warn(
      "getCharactersByAccountId - use CharacterSelect from Cap'n Proto flow"
    );
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCharacterByUserId(
    _userId: string
  ): Promise<CharacterProfile | null> {
    console.warn(
      "getCharacterByUserId - use PlayerProfile from Cap'n Proto flow"
    );
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCharacter(
    _characterData: CharacterProfile
  ): Promise<CharacterProfile | null> {
    console.warn("createCharacter - use CharCreate from Cap'n Proto flow");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateCharacter(
    _id: number,
    _characterData: CharacterProfile
  ): Promise<CharacterProfile | null> {
    console.warn("updateCharacter not yet implemented with Cap'n Proto");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteCharacter(_id: number): Promise<boolean> {
    console.warn("deleteCharacter - use DeleteCharacter from Cap'n Proto flow");
    return false;
  }
}

export const eqDataService = new EQDataService();
