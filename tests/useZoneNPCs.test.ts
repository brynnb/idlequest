import { describe, it, expect, beforeAll } from "vitest";
import { getZoneNPCs } from "../src/utils/getZoneNPCs";
import { initDatabase } from "../src/utils/databaseOperations";

describe("getZoneNPCs", () => {
  beforeAll(async () => {
    await initDatabase(true); // Pass true to indicate test environment
  });

  it("fetches NPCs for gfaydark", async () => {
    const npcs = await getZoneNPCs("gfaydark");

    expect(Array.isArray(npcs)).toBe(true);
    expect(npcs.length).toBeGreaterThan(0);

    console.log('NPCs in Greater Faydark:');
    npcs.forEach(npc => {
      console.log(`ID: ${npc.id}, Name: ${npc.name}, Level: ${npc.level}`);
    });

    // Basic property check
    npcs.forEach(npc => {
      expect(npc).toHaveProperty('id');
      expect(npc).toHaveProperty('name');
      expect(npc).toHaveProperty('level');
    });
  });

  it("returns an empty array for non-existent zone", async () => {
    const npcs = await getZoneNPCs("nonexistentzone");
    expect(npcs).toEqual([]);
  });
});