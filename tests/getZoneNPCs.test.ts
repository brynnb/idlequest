import { describe, it, expect, vi, beforeEach } from "vitest";
import { getZoneNPCs } from "../src/utils/getZoneNPCs";

// Mock the database operations
vi.mock("../src/utils/databaseOperations", () => ({
  initDatabase: vi.fn(),
  getZoneNPCs: vi.fn((zoneName) => {
    if (zoneName === "gfaydark") {
      return Promise.resolve([]);
    }
    return Promise.reject(new Error(`Zone with name ${zoneName} not found`));
  }),
}));

// Create spy functions
const getZoneNameByIdSpy = vi.fn((id) => (id === 54 ? "gfaydark" : undefined));
const getZoneIdByNameSpy = vi.fn((name) =>
  name === "gfaydark" ? 54 : undefined
);

// Mock the GameStatusStore
vi.mock("../src/stores/GameStatusStore", () => ({
  default: {
    getState: vi.fn(() => ({
      getZoneNameById: getZoneNameByIdSpy,
      getZoneIdByName: getZoneIdByNameSpy,
    })),
  },
}));

describe("getZoneNPCs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches NPCs for gfaydark", async () => {
    const npcs = await getZoneNPCs(54);
    expect(Array.isArray(npcs)).toBe(true);
    expect(getZoneNameByIdSpy).toHaveBeenCalledWith(54);
  });

  it("returns an empty array for non-existent zone ID", async () => {
    await expect(getZoneNPCs(9999)).rejects.toThrow(
      "Zone with ID 9999 not found"
    );
    expect(getZoneNameByIdSpy).toHaveBeenCalledWith(9999);
  });

  it("returns an empty array for non-existent zone name", async () => {
    await expect(getZoneNPCs("nonexistentzone")).rejects.toThrow(
      "Zone with name nonexistentzone not found"
    );
    expect(getZoneIdByNameSpy).toHaveBeenCalledWith("nonexistentzone");
  });
});
