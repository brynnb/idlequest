import React from "react";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";
import characterCombinations from "../../data/char_create_combinations.json";
import attributeAllocations from "../../data/char_create_point_allocations.json";

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

    console.log(`Selected Race ID: ${raceId}, Selected Class ID: ${classId}`);

    const combination = characterCombinations.find(
      (combo) => combo.race === raceId && combo.class === classId
    );

    if (!combination) {
      console.error(
        `No combination found for race ${raceId} and class ${classId}`
      );
      return;
    }

    console.log(`Found combination: `, combination);

    const allocation = attributeAllocations.find(
      (alloc) => alloc.id === combination.allocation_id
    );

    if (!allocation) {
      console.error(
        `No allocation found for allocation_id: ${combination.allocation_id}`
      );
      return;
    }

    console.log(`Found allocation: `, allocation);

    const newAttributes = { ...attributes };
    let remainingPoints = attributePoints;

    baseAttributes.forEach((attr) => {
      const allocKey = `alloc_${attr}` as keyof typeof allocation;
      const allocPoints = allocation[allocKey] as number;

      if (typeof allocPoints !== "number") {
        console.error(`Invalid allocation for ${attr}`);
        return;
      }

      const currentPoints = newAttributes[attr];
      const pointsToAdd = Math.min(allocPoints, remainingPoints);

      newAttributes[attr] = currentPoints + pointsToAdd;
      remainingPoints -= pointsToAdd;

      console.log(
        `Allocated ${pointsToAdd} points to ${attr}. New value: ${newAttributes[attr]}`
      );
    });

    setAttributes(newAttributes);
    console.log(`Final attributes: `, newAttributes);
  };

  return (
    <button onClick={autoAllocate} disabled={attributePoints === 0}>
      Auto Allocate
    </button>
  );
};

export default AttributeAutoAllocatorButton;
