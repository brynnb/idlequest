import Race from "@entities/Race";
import CharacterClass from "@entities/CharacterClass";
import CharacterCreationAttributes from "@entities/CharacterCreationAttributes";
import charCreateCombinations from "@data/json/char_create_combinations.json";
import charCreatePointAllocations from "@data/json/char_create_point_allocations.json";

type BaseAttributeKey = "str" | "sta" | "dex" | "agi" | "int" | "wis" | "cha";
type BaseAllocationKey = `base_${BaseAttributeKey}`;

type BaseAllocation = {
  id: number;
} & Record<BaseAllocationKey, number>;

const baseAttributeKeys: BaseAttributeKey[] = [
  "str",
  "sta",
  "dex",
  "agi",
  "int",
  "wis",
  "cha",
];

const getBaseAttributes = (
  race: Race | null,
  charClass: CharacterClass | null
): CharacterCreationAttributes => {
  const baseAttributes = baseAttributeKeys.reduce((acc, attr) => {
    acc[`base_${attr}` as keyof CharacterCreationAttributes] = 0;
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
        const typedSet = attributeSet as unknown as BaseAllocation;
        baseAttributeKeys.forEach((attr) => {
          const baseKey = `base_${attr}` as keyof CharacterCreationAttributes;
          baseAttributes[baseKey] = typedSet[baseKey as BaseAllocationKey] || 0;
        });
      }
    }
  }

  // Apply race and class modifiers
  if (race) {
    const raceMods = race as unknown as Partial<
      Record<BaseAttributeKey, number>
    >;
    baseAttributeKeys.forEach((attr) => {
      const baseKey = `base_${attr}` as keyof CharacterCreationAttributes;
      baseAttributes[baseKey] += raceMods[attr] ?? 0;
    });
  }

  if (charClass) {
    const classMods = charClass as unknown as Partial<
      Record<BaseAttributeKey, number>
    >;
    baseAttributeKeys.forEach((attr) => {
      const baseKey = `base_${attr}` as keyof CharacterCreationAttributes;
      baseAttributes[baseKey] += classMods[attr] ?? 0;
    });
  }

  return baseAttributes;
};

export default getBaseAttributes;
