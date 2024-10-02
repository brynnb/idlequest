import { initDatabase, getItemById } from "../src/utils/databaseOperations";
import getItemScore from "../src/utils/getItemScore";
import CharacterClass from "../src/entities/CharacterClass";

describe("getItemScore", () => {
  beforeAll(async () => {
    await initDatabase(true); // Initialize the database in test mode
  });

  it("compares scores for items 5019 and 10908 for Warrior class", async () => {
    const warrior: CharacterClass = { id: 1, name: "Warrior" };

    const item5019 = await getItemById(3151);
    const item10908 = await getItemById(7825);

    if (!item5019 || !item10908) {
      throw new Error("One or both items not found in the database");
    }

    const score5019 = getItemScore(item5019, warrior);
    const score10908 = getItemScore(item10908, warrior);

    console.log(`Score for item ${item5019.name} (ID: 5019): ${score5019}`);
    console.log(`Score for item ${item10908.name} (ID: 10908): ${score10908}`);

    expect(typeof score5019).toBe("number");
    expect(typeof score10908).toBe("number");
  });
});
