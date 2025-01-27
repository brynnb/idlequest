import React from "react";
import { useNavigate } from "react-router-dom";
import useInventoryCreator from "@hooks/useInventoryCreator";
import { createNewCharacterProfile } from "@utils/playerCharacterUtils";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { useInventoryActions } from "@hooks/useInventoryActions";

const SubmitCharacter: React.FC = () => {
  const navigate = useNavigate();
  const { loading, createInventory } = useInventoryCreator();
  const { handleLoot } = useInventoryActions();
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    allPointsAllocated,
    attributes,
  } = useCharacterCreatorStore();

  const { setCharacterProfile } = usePlayerCharacterStore();

  const handleSubmit = async () => {
    const startingItems = await createNewCharacterProfile(
      {
        characterName,
        selectedRace,
        selectedClass,
        selectedDeity,
        selectedZone,
        attributes,
        allPointsAllocated,
      },
      createInventory,
      setCharacterProfile
    );
    handleLoot(startingItems);
    navigate("/");
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
