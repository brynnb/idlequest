import { describe, it, expect, vi } from "vitest";
import { getZoneNPCs } from "../src/utils/getZoneNPCs";
import { zoneCache } from "../src/utils/zoneCache";
import * as databaseOperations from "../src/utils/databaseOperations";

// Mock the database operations and zoneCache
vi.mock("../src/utils/databaseOperations", () => ({
  initDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    exec: vi.fn(() => [])
  }))
}));

vi.mock("../src/utils/zoneCache", () => ({
  zoneCache: {
    getNameById: vi.fn((id) => id === 54 ? 'gfaydark' : undefined),
    getIdByName: vi.fn((name) => name === 'gfaydark' ? 54 : undefined)
  }
}));

describe("getZoneNPCs", () => {
  it("fetches NPCs for gfaydark", async () => {
    const npcs = await getZoneNPCs(54);
    expect(Array.isArray(npcs)).toBe(true);
  });

  it("returns an empty array for non-existent zone ID", async () => {
    await expect(getZoneNPCs(9999)).rejects.toThrow("Zone with ID 9999 not found");
  });

  it("returns an empty array for non-existent zone name", async () => {
    await expect(getZoneNPCs("nonexistentzone")).rejects.toThrow("Zone with name nonexistentzone not found");
  });
});
