import React from "react";
import useInventoryCreator from "@hooks/useInventoryCreator";
import { createNewCharacterProfile } from "@utils/playerCharacterUtils";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";

const SubmitCharacter: React.FC = () => {
  const { loading } = useInventoryCreator();
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    allPointsAllocated
  } = useCharacterCreatorStore();

  const handleSubmit = async () => {
    await createNewCharacterProfile(
      characterCreatorState,
      createInventory,
      setCharacterProfile
    );  };

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
