import { calculatePlayerHP } from "../src/utils/playerCharacterUtils";
import CharacterProfile from "../src/entities/CharacterProfile";

describe("calculatePlayerHP", () => {
  it("calculates HP correctly for a level 1 warrior with 110 stamina", () => {
    const warriorCharacter: CharacterProfile = {
      level: 1,
      class: { id: 1 }, // Warrior
      attributes: {
        sta: 110,
      },
    };

    const expectedHP = 35;
    const calculatedHP = calculatePlayerHP(warriorCharacter);

    expect(calculatedHP).toBe(expectedHP);
  });
});
