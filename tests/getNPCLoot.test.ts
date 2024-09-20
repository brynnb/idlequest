import { describe, it, expect, beforeAll } from "vitest";
import { getNPCLoot } from "../src/utils/getNPCLoot";

describe("getNPCLoot", () => {
  it("fetches loot for the first NPC in Greater Faydark", async () => {
    const gfaydarkId = 54; // Real ID for Greater Faydark
    const loot = await getNPCLoot(gfaydarkId);

    expect(Array.isArray(loot)).toBe(true);

    console.log("Loot for the first NPC in Greater Faydark:");
    loot.forEach((item) => {
      console.log(`ID: ${item.id}, Name: ${item.name}, Price: ${item.price}`);
    });

    // Basic property check
    loot.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
    });
  });

  it("throws an error for a non-existent zoneID", async () => {
    await expect(getNPCLoot(9999)).rejects.toThrow(
      "Zone with ID 9999 not found"
    );
  });
});
