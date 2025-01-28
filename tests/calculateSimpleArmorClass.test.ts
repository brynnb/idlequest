import { calculateSimpleArmorClass } from "../src/utils/calculateSimpleArmorClass";
import CharacterProfile from "../src/entities/CharacterProfile";
import { ClassId } from "../src/entities/CharacterClass";
import { RaceId } from "../src/entities/Race";

describe("calculateSimpleArmorClass", () => {
  it("should calculate AC for a level 60 iksar warrior", () => {
    const mockCharacter: Partial<CharacterProfile> = {
      level: 60,
      race: RaceId.Iksar,
      class: ClassId.Warrior,
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

    const result = calculateSimpleArmorClass(mockCharacter as CharacterProfile);

    console.log(`Level 60 Iksar Warrior AC: ${result}`);
    expect(result).toBeGreaterThan(0);
  });

  it("should calculate AC for a level 1 iksar necromancer", () => {
    const mockCharacter: Partial<CharacterProfile> = {
      level: 1,
      race: RaceId.Iksar,
      class: ClassId.Necromancer,
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

    const result = calculateSimpleArmorClass(mockCharacter as CharacterProfile);
    console.log(`Level 1 Iksar Necromancer AC: ${result}`);
    expect(result).toBe(25);
  });

  it("should calculate AC for a level 40 Wood Elf Druid", () => {
    const mockCharacter: Partial<CharacterProfile> = {
      level: 40,
      race: RaceId.WoodElf,
      class: ClassId.Druid,
      attributes: {
        str: 65,
        sta: 80,
        agi: 65,
        dex: 80,
        wis: 115,
        int: 75,
        cha: 75,
      },
      intoxication: 0,
    };

    const result = calculateSimpleArmorClass(mockCharacter as CharacterProfile);
    console.log(`Level 40 Wood Elf Druid AC: ${result}`);
    expect(result).toBe(915);
  });
});
