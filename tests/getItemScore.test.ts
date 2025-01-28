import { initDatabase, getItemById } from "../src/utils/databaseOperations";
import getItemScore from "../src/utils/getItemScore";
import CharacterClass from "../src/entities/CharacterClass";
import classes from "../data/classes.json";

describe("getItemScore", () => {
  beforeAll(async () => {
    await initDatabase(true); // Initialize the database in test mode
  });

  it("compares scores for items 5019 and 10908 for Warrior class", async () => {
    const warrior = classes.find((c: CharacterClass) => c.id === 1);
    if (!warrior) {
      throw new Error("Warrior class not found in classes.json");
    }

    const item5019 = await getItemById(5019); //Rusty Long Sword, crappy low end weapon
    const item10908 = await getItemById(10908); //Jagged Blade of War, high end epic weapon, should score much higher

    if (!item5019 || !item10908) {
      throw new Error("One or both items not found in the database");
    }

    const score5019 = getItemScore(item5019, warrior);
    const score10908 = getItemScore(item10908, warrior);

    console.log(`Score for item ${item5019.name} (ID: 5019): ${score5019}`);
    console.log(`Score for item ${item10908.name} (ID: 10908): ${score10908}`);

    expect(typeof score5019).toBe("number");
    expect(typeof score10908).toBe("number");
    expect(score10908).toBeGreaterThan(score5019);
  });
});
