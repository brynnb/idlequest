import Race from "@entities/Race";
import CharacterClass from "@entities/CharacterClass";
import CharacterCreationAttributes from "@entities/CharacterCreationAttributes";
import charCreateCombinations from "@data/json/char_create_combinations.json";
import charCreatePointAllocations from "@data/json/char_create_point_allocations.json";

const baseAttributeKeys = ["str", "sta", "dex", "agi", "int", "wis", "cha"];

const getBaseAttributes = (
  race: Race | null,
  charClass: CharacterClass | null
): CharacterCreationAttributes => {
  const baseAttributes = baseAttributeKeys.reduce((acc, attr) => {
    acc[`base_${attr}`] = 0;
    acc[attr] = 0;
    return acc;
  }, {} as CharacterCreationAttributes);

  if (race && charClass) {
    const combination = charCreateCombinations.find(
      (combo) => combo.race === race.id && combo.class === charClass.id
    );

    if (combination) {
      const allocationId = combination.allocation_id;
      const attributeSet = charCreatePointAllocations.find(
        (attr) => attr.id === allocationId
      );

      if (attributeSet) {
        baseAttributeKeys.forEach((attr) => {
          baseAttributes[`base_${attr}`] = attributeSet[`base_${attr}`] || 0;
        });
      }
    }
  }

  // Apply race and class modifiers
  if (race) {
    baseAttributeKeys.forEach((attr) => {
      if (attr in race) {
        baseAttributes[`base_${attr}`] += race[attr as keyof Race] as number;
      }
    });
  }

  if (charClass) {
    baseAttributeKeys.forEach((attr) => {
      if (attr in charClass) {
        baseAttributes[`base_${attr}`] += charClass[
          attr as keyof CharacterClass
        ] as number;
      }
    });
  }

  return baseAttributes;
};

export default getBaseAttributes;
