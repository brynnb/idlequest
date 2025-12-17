import React from "react";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";
import SelectionButton from "../Interface/SelectionButton";

const AttributeAutoAllocatorButton: React.FC = () => {
  const { setAttributes, attributePoints, selectedRace, selectedClass } =
    useCharacterCreatorStore();

  const combinations = useStaticDataStore(
    (state) => state.charCreateCombinations
  );
  const allocations = useStaticDataStore(
    (state) => state.charCreatePointAllocations
  );

  const autoAllocate = () => {
    if (!selectedRace || !selectedClass) return;

    const combination = combinations.find(
      (combo) =>
        combo.race === selectedRace.id && combo.class === selectedClass.id
    );

    if (!combination) {
      return;
    }

    const allocation = allocations.find(
      (alloc) => alloc.id === combination.allocationId
    );

    if (!allocation) {
      return;
    }

    // Reset to base values first, then apply optimal allocation
    // This ensures any user allocations are undone before applying the optimal
    const newAttributes = {
      base_str: allocation.baseStr,
      base_sta: allocation.baseSta,
      base_agi: allocation.baseAgi,
      base_dex: allocation.baseDex,
      base_wis: allocation.baseWis,
      base_int: allocation.baseInt,
      base_cha: allocation.baseCha,
      str: allocation.baseStr + allocation.allocStr,
      sta: allocation.baseSta + allocation.allocSta,
      agi: allocation.baseAgi + allocation.allocAgi,
      dex: allocation.baseDex + allocation.allocDex,
      wis: allocation.baseWis + allocation.allocWis,
      int: allocation.baseInt + allocation.allocInt,
      cha: allocation.baseCha + allocation.allocCha,
    };

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
