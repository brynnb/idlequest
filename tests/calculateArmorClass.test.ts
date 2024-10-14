import { calculateArmorClass } from "../src/utils/calculateArmorClass";
import CharacterProfile from "../src/entities/CharacterProfile";
import { ClassId } from "../src/entities/CharacterClass";
import { RaceId } from "../src/entities/Race";

describe("calculateArmorClass", () => {
  it("should calculate AC for a level 1 human warrior", () => {
    const mockCharacter: Partial<CharacterProfile> = {
      level: 60,
      race: { id: RaceId.Iksar },
      class: { id: ClassId.Warrior },
      attributes: {
        str: 75,
        sta: 75,
        agi: 75,
        dex: 75,
        wis: 75,
        int: 75,
        cha: 75,
      },
      intoxication: 0,
    };

    const result = calculateArmorClass(mockCharacter as CharacterProfile);

    expect(result).toHaveProperty("displayedMitigationAC");
    expect(result).toHaveProperty("displayedEvasionAC");
    expect(result.displayedMitigationAC).toBeGreaterThan(0);
    expect(result.displayedEvasionAC).toBeGreaterThan(0);

    console.log(result);

    // You may want to add more specific expectations based on your calculations
    // For example:
    // expect(result.displayedMitigationAC).toBe(expectedMitigationAC);
    // expect(result.displayedEvasionAC).toBe(expectedEvasionAC);
  });
});

describe("calculateArmorClass", () => {
  it("should calculate AC for a level 1 iksar necromancer", () => {
    const mockCharacter: Partial<CharacterProfile> = {
      level: 1,
      race: { id: RaceId.Iksar },
      class: { id: ClassId.Necromancer },
      attributes: {
        str: 75,
        sta: 80,
        agi: 90,
        dex: 95,
        wis: 80,
        int: 100,
        cha: 55,
      },
      intoxication: 0,
    };

    const result = calculateArmorClass(mockCharacter as CharacterProfile);
    console.log(result);

    expect(result.displayedMitigationAC + result.displayedEvasionAC).toBe(30);
  });
});


describe("calculateArmorClass", () => {
    it("should calculate AC for a level 40 Wood Elf Druid", () => {
      const mockCharacter: Partial<CharacterProfile> = {
        level: 40,
        race: { id: RaceId.WoodElf },
        class: { id: ClassId.Druid },
        attributes: {
          str: 65,
          sta: 80,
          agi: 65, //can't quite read the value in reference video
          dex: 80,
          wis: 115,
          int: 75,
          cha: 75,
        },
        intoxication: 0,
      };
  
      const result = calculateArmorClass(mockCharacter as CharacterProfile);
  
      expect(result.displayedMitigationAC + result.displayedEvasionAC).toBe(295);
    });
  });