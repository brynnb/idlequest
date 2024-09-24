import { describe, it, expect, vi, beforeEach } from "vitest";
import { getZoneNPCs } from "../src/utils/getZoneNPCs";
import * as databaseOperations from "../src/utils/databaseOperations";
import useGameStatusStore from "../src/stores/GameStatusStore";

// Mock the database operations
vi.mock("../src/utils/databaseOperations", () => ({
  initDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    exec: vi.fn(() => [])
  }))
}));

// Mock the GameStatusStore
vi.mock("../src/stores/GameStatusStore", () => ({
  default: {
    getState: vi.fn(() => ({
      getZoneNameById: vi.fn((id) => id === 54 ? 'gfaydark' : undefined),
      getZoneIdByName: vi.fn((name) => name === 'gfaydark' ? 54 : undefined)
    }))
  }
}));

describe("getZoneNPCs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches NPCs for gfaydark", async () => {
    const npcs = await getZoneNPCs(54);
    expect(Array.isArray(npcs)).toBe(true);
    expect(useGameStatusStore.getState().getZoneNameById).toHaveBeenCalledWith(54);
  });

  it("returns an empty array for non-existent zone ID", async () => {
    await expect(getZoneNPCs(9999)).rejects.toThrow("Zone with ID 9999 not found");
    expect(useGameStatusStore.getState().getZoneNameById).toHaveBeenCalledWith(9999);
  });

  it("returns an empty array for non-existent zone name", async () => {
    await expect(getZoneNPCs("nonexistentzone")).rejects.toThrow("Zone with name nonexistentzone not found");
    expect(useGameStatusStore.getState().getZoneIdByName).toHaveBeenCalledWith("nonexistentzone");
  });
});
