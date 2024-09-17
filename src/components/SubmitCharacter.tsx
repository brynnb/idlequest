import React from "react";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import useInventoryCreator from "../hooks/useInventoryCreator";

const SubmitCharacter: React.FC = () => {
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    attributes,
    allPointsAllocated,
  } = useCharacterCreatorStore();

  const setCharacterProfile = usePlayerCharacterStore(
    (state) => state.setCharacterProfile
  );
  const setInventory = usePlayerCharacterStore(
    (state) => state.setInventory
  );

  const { createInventory, loading } = useInventoryCreator();

  const handleSubmit = async () => {
    const newCharacterProfile = {
      name: characterName,
      race: selectedRace,
      class: selectedClass,
      deity: selectedDeity,
      startingZone: selectedZone,
      attributes: {
        str: attributes.str + attributes.base_str,
        sta: attributes.sta + attributes.base_sta,
        cha: attributes.cha + attributes.base_cha,
        dex: attributes.dex + attributes.base_dex,
        int: attributes.int + attributes.base_int,
        agi: attributes.agi + attributes.base_agi,
        wis: attributes.wis + attributes.base_wis,
      }
    };

    setCharacterProfile(newCharacterProfile);

    const inventory = await createInventory(
      selectedRace.id,
      selectedClass.id,
      selectedDeity.id,
      selectedZone.id
    );
    setInventory(inventory);

    console.log("Character created successfully!");
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={
        !characterName ||
        !selectedRace ||
        !selectedClass ||
        !selectedDeity ||
        !selectedZone ||
        !allPointsAllocated ||
        loading
      }
    >
      Create Character
    </button>
  );
};

export default SubmitCharacter;
