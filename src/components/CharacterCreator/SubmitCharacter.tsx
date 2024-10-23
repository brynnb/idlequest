import React from "react";
import useInventoryCreator from "@hooks/useInventoryCreator";
import { createNewCharacterProfile } from "@utils/playerCharacterUtils";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

const SubmitCharacter: React.FC = () => {
  const { loading, createInventory } = useInventoryCreator();
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    allPointsAllocated,
    attributes
  } = useCharacterCreatorStore();

  const { setCharacterProfile } = usePlayerCharacterStore();

  const handleSubmit = async () => {
    await createNewCharacterProfile(
      {
        characterName,
        selectedRace,
        selectedClass,
        selectedDeity,
        selectedZone,
        attributes,
        allPointsAllocated
      },
      createInventory,
      setCharacterProfile
    );
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
