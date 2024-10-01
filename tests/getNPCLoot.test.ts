import { describe, it, expect } from "vitest";
import { getNPCLoot } from "../src/utils/getNPCLoot";

describe("getNPCLoot", () => {
  it("should log and return loot for NPC with ID 10175", async () => {
    const result = await getNPCLoot(10175);
    console.log("Loot for NPC 10175:", result);
    expect(result).toBeDefined();
  });
});
