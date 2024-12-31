import React from "react";
import useCharacterCreatorStore from "/src/stores/CharacterCreatorStore";
import characterCombinations from "/data/char_create_combinations.json";
import attributeAllocations from "/data/char_create_point_allocations.json";
import SelectionButton from "../Interface/SelectionButton";

interface CharacterCombination {
  race: string;
  class: string;
  allocation_id: number;
}

interface AttributeAllocation {
  id: number;
  alloc_str: number;
  alloc_sta: number;
  alloc_dex: number;
  alloc_agi: number;
  alloc_int: number;
  alloc_wis: number;
  alloc_cha: number;
}

const baseAttributes = [
  "str",
  "sta",
  "dex",
  "agi",
  "int",
  "wis",
  "cha",
] as const;

const AttributeAutoAllocatorButton: React.FC = () => {
  const {
    attributes,
    setAttributes,
    attributePoints,
    selectedRace,
    selectedClass,
  } = useCharacterCreatorStore();

  const autoAllocate = () => {
    const raceId =
      typeof selectedRace === "object" ? selectedRace.id : selectedRace;
    const classId =
      typeof selectedClass === "object" ? selectedClass.id : selectedClass;

    const combination = characterCombinations.find(
      (combo: CharacterCombination) =>
        combo.race === raceId && combo.class === classId
    );

    if (!combination) {
      return;
    }

    const allocation = attributeAllocations.find(
      (alloc: AttributeAllocation) => alloc.id === combination.allocation_id
    );

    if (!allocation) {
      return;
    }

    const newAttributes = { ...attributes };
    let remainingPoints = attributePoints;

    baseAttributes.forEach((attr) => {
      const allocKey = `alloc_${attr}` as keyof typeof allocation;
      const allocPoints = allocation[allocKey] as number;

      if (typeof allocPoints !== "number") {
        return;
      }

      const currentPoints = newAttributes[attr];
      const pointsToAdd = Math.min(allocPoints, remainingPoints);

      newAttributes[attr] = currentPoints + pointsToAdd;
      remainingPoints -= pointsToAdd;
    });

    setAttributes(newAttributes);
  };

  return (
    <SelectionButton
      onClick={autoAllocate}
      disabled={attributePoints === 0}
      $isSelected={false}
      $isDisabled={attributePoints === 0}
    >
      Auto Allocate
    </SelectionButton>
  );
};

export default AttributeAutoAllocatorButton;
