import dotenv from "dotenv";
dotenv.config();

import { getNPCDialogue } from "../src/utils/getNPCDialogue";

describe("getNPCDialogue", () => {
  it("should fetch dialogue for Devin_Ashwood", async () => {
    const npcName = "Devin_Ashwood";
    const result = await getNPCDialogue(npcName);
    // console.log(`Dialogue for ${npcName}:`, result);
    expect(result).not.toBeNull();
  }, 30000);  // Increased timeout to 30 seconds
});
