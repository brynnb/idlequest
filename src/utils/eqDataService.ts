import { webTransportClient } from "./webTransportClient";
import CharacterProfile from "@entities/CharacterProfile";

export interface Item {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface Zone {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name?: string;
  [key: string]: unknown;
}

export interface NPCType {
  id: number;
  name: string;
  [key: string]: unknown;
}

class EQDataService {
  private readonly API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:443";

  private async restGet<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.API_BASE_URL}${path}`, {
        credentials: "omit",
        mode: "cors",
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (e) {
      console.error("REST fallback failed:", e);
      return null;
    }
  }
  async getItemById(id: number): Promise<Item | null> {
    try {
      const item = await webTransportClient.getItemById(id);
      return item;
    } catch (error) {
      console.warn("WT failed, falling back to REST for item", id, error);
      return await this.restGet<Item>(`/api/items/${id}`);
    }
  }

  async getAllItems(): Promise<Item[]> {
    try {
      const items = await webTransportClient.getAllItems();
      return items;
    } catch (error) {
      console.error("Error fetching items via WebTransport:", error);
      return [];
    }
  }

  async getZoneById(id: number): Promise<Zone | null> {
    try {
      const zone = await webTransportClient.getZoneById(id);
      return zone;
    } catch (error) {
      console.error("Error fetching zone by ID via WebTransport:", error);
      return null;
    }
  }

  async getZoneByZoneId(zoneidnumber: number): Promise<Zone | null> {
    try {
      const zone = await webTransportClient.getZoneByZoneId(zoneidnumber);
      return zone;
    } catch (error) {
      console.warn(
        "WT failed, falling back to REST for zoneidnumber",
        zoneidnumber,
        error
      );
      return await this.restGet<Zone>(`/api/zones/byZoneId/${zoneidnumber}`);
    }
  }

  async getAllZones(): Promise<Zone[]> {
    try {
      const zones = await webTransportClient.getAllZones();
      return zones;
    } catch (error) {
      console.error("Error fetching zones via WebTransport:", error);
      return [];
    }
  }

  async getZoneNPCs(zoneName: string): Promise<NPCType[]> {
    // Use WebTransport to fetch zone NPCs from the server
    try {
      const npcs = await webTransportClient.getZoneNPCs(zoneName);
      return npcs as NPCType[];
    } catch (error) {
      console.warn(
        "WebTransport getZoneNPCs failed, falling back to local DB:",
        error
      );
      // Fallback to local database if WebTransport fails
      try {
        const { getZoneNPCs } = await import("@utils/getZoneNPCs");
        return await getZoneNPCs(zoneName);
      } catch (fallbackError) {
        console.error(
          "eqDataService.getZoneNPCs fallback failed:",
          fallbackError
        );
        return [];
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNPCLoot(_npcId: number): Promise<Item[]> {
    console.warn("getNPCLoot not yet migrated to WebTransport");
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAdjacentZones(_zoneId: number): Promise<Zone[]> {
    console.warn("getAdjacentZones not yet migrated to WebTransport");
    return [];
  }

  // Character operations via WebTransport
  async getCharacterById(id: number): Promise<CharacterProfile | null> {
    try {
      const character = await webTransportClient.getCharacterById(id);
      return character;
    } catch (error) {
      console.error("Error fetching character via WebTransport:", error);
      return null;
    }
  }

  async getCharacterByName(name: string): Promise<CharacterProfile | null> {
    try {
      const character = await webTransportClient.getCharacterByName(name);
      return character;
    } catch (error) {
      console.error(
        "Error fetching character by name via WebTransport:",
        error
      );
      return null;
    }
  }

  async getCharactersByAccountId(
    accountId: number
  ): Promise<CharacterProfile[]> {
    try {
      const characters = await webTransportClient.getCharactersByAccountId(
        accountId
      );
      return characters;
    } catch (error) {
      console.error(
        "Error fetching characters by account ID via WebTransport:",
        error
      );
      return [];
    }
  }

  // Legacy REST API method names for backward compatibility
  async getCharacterByUserId(userId: string): Promise<CharacterProfile | null> {
    // For now, assume userId maps to accountId
    try {
      const accountId = parseInt(userId, 10);
      if (isNaN(accountId)) {
        console.error("Invalid userId for getCharacterByUserId:", userId);
        return null;
      }
      const characters = await this.getCharactersByAccountId(accountId);
      return characters.length > 0 ? characters[0] : null;
    } catch (error) {
      console.error("Error in getCharacterByUserId:", error);
      return null;
    }
  }

  // TODO: These operations will need WebTransport implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCharacter(
    _characterData: CharacterProfile
  ): Promise<CharacterProfile | null> {
    console.warn("createCharacter not yet implemented with WebTransport");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateCharacter(
    _id: number,
    _characterData: CharacterProfile
  ): Promise<CharacterProfile | null> {
    console.warn("updateCharacter not yet implemented with WebTransport");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteCharacter(_id: number): Promise<boolean> {
    console.warn("deleteCharacter not yet implemented with WebTransport");
    return false;
  }
}

export const eqDataService = new EQDataService();
