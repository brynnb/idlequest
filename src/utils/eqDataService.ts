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
  GetAllZonesRequest,
  GetAllZonesResponse,
  GetSpellRequest,
  GetSpellResponse,
  GetEqstrRequest,
  GetEqstrResponse,
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
  itemtype?: number;
  scrolleffect?: number;
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

export interface Spell {
  id: number;
  name: string;
  castTime?: number;
  buffduration?: number;
  mana?: number;
  icon?: number;
  descnum?: number;
  effectBaseValue1?: number;
  effectBaseValue2?: number;
  effectBaseValue3?: number;
  effectLimitValue1?: number;
  effectLimitValue2?: number;
  effectLimitValue3?: number;
  max1?: number;
  max2?: number;
  max3?: number;
  formula1?: number;
  formula2?: number;
  formula3?: number;
  classes1?: number;
  classes2?: number;
  classes3?: number;
  classes4?: number;
  classes5?: number;
  classes6?: number;
  classes7?: number;
  classes8?: number;
  classes9?: number;
  classes10?: number;
  classes11?: number;
  classes12?: number;
  classes13?: number;
  classes14?: number;
  [key: string]: unknown;
}

export interface EqstrEntry {
  id: number;
  text: string;
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
        itemtype: response.itemtype,
        scrolleffect: response.scrolleffect,
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
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getAllZones");
        return [];
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetAllZonesRequest,
        OpCodes.GetAllZonesResponse,
        GetAllZonesRequest,
        GetAllZonesResponse,
        {}
      );
      if (!response.success) {
        console.error("GetAllZones failed:", response.error);
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
          safe_x: zone.safeX,
          safe_y: zone.safeY,
          safe_z: zone.safeZ,
          min_level: zone.minLevel,
          max_level: zone.maxLevel,
        });
      }
      return zones;
    } catch (error) {
      console.error("Error fetching all zones via Cap'n Proto:", error);
      return [];
    }
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

  async getSpellById(id: number): Promise<Spell | null> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getSpellById");
        return null;
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetSpellRequest,
        OpCodes.GetSpellResponse,
        GetSpellRequest,
        GetSpellResponse,
        { spellId: id }
      );
      if (!response.success) {
        console.error("GetSpell failed:", response.error);
        return null;
      }
      return {
        id: response.id,
        name: response.name,
        castTime: response.castTime,
        buffduration: response.buffduration,
        mana: response.mana,
        icon: response.icon,
        descnum: response.descnum,
        effectBaseValue1: response.effectBaseValue1,
        effectBaseValue2: response.effectBaseValue2,
        effectBaseValue3: response.effectBaseValue3,
        effectLimitValue1: response.effectLimitValue1,
        effectLimitValue2: response.effectLimitValue2,
        effectLimitValue3: response.effectLimitValue3,
        max1: response.max1,
        max2: response.max2,
        max3: response.max3,
        formula1: response.formula1,
        formula2: response.formula2,
        formula3: response.formula3,
        classes1: response.classes1,
        classes2: response.classes2,
        classes3: response.classes3,
        classes4: response.classes4,
        classes5: response.classes5,
        classes6: response.classes6,
        classes7: response.classes7,
        classes8: response.classes8,
        classes9: response.classes9,
        classes10: response.classes10,
        classes11: response.classes11,
        classes12: response.classes12,
        classes13: response.classes13,
        classes14: response.classes14,
      };
    } catch (error) {
      console.error("Error fetching spell via Cap'n Proto:", error);
      return null;
    }
  }

  async getEqstrById(id: number): Promise<EqstrEntry | null> {
    try {
      if (!WorldSocket.isConnected) {
        console.warn("WorldSocket not connected for getEqstrById");
        return null;
      }
      const response = await WorldSocket.sendRequest(
        OpCodes.GetEqstrRequest,
        OpCodes.GetEqstrResponse,
        GetEqstrRequest,
        GetEqstrResponse,
        { stringId: id }
      );
      if (!response.success) {
        console.error("GetEqstr failed:", response.error);
        return null;
      }
      return {
        id: response.id,
        text: response.text,
      };
    } catch (error) {
      console.error("Error fetching eqstr via Cap'n Proto:", error);
      return null;
    }
  }
}

export const eqDataService = new EQDataService();
