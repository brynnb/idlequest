import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import { webTransportClient } from "@utils/webTransportClient";
import SelectionButton from "../Interface/SelectionButton";

const SubmitCharacter: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    allPointsAllocated,
    attributes,
    resetStore,
  } = useCharacterCreatorStore();

  const handleSubmit = async () => {
    if (!selectedRace || !selectedClass || !selectedDeity || !selectedZone) {
      console.error("Missing required character creation fields");
      return;
    }

    setLoading(true);
    try {
      // Send character creation request to server
      // Server will push CHARACTER_STATE which updates the store automatically
      await webTransportClient.createCharacter({
        name: characterName,
        race: selectedRace.id,
        class: selectedClass.id,
        deity: selectedDeity.id,
        zoneId: selectedZone.zoneidnumber,
        gender: 0, // Default gender, could be added to character creator
        face: 0, // Default face, could be added to character creator
        str: attributes.str + attributes.base_str,
        sta: attributes.sta + attributes.base_sta,
        cha: attributes.cha + attributes.base_cha,
        dex: attributes.dex + attributes.base_dex,
        int: attributes.int + attributes.base_int,
        agi: attributes.agi + attributes.base_agi,
        wis: attributes.wis + attributes.base_wis,
      });

      console.log("Character creation request sent, navigating to main page");
      navigate("/", { state: { fromCreate: true } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "");

      if (message.includes("Duplicate entry")) {
        // Name is already taken - fully reset the character creator to step 1
        resetStore();

        window.alert(
          "That name is already taken. Please choose a different character name."
        );
      } else {
        // Log unexpected errors
        console.error("Failed to create character:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    !characterName ||
    !selectedRace ||
    !selectedClass ||
    !selectedDeity ||
    !selectedZone ||
    !allPointsAllocated ||
    loading;

  return (
    <SelectionButton
      onClick={handleSubmit}
      disabled={disabled}
      $isSelected={false}
      $isDisabled={disabled}
    >
      Create
    </SelectionButton>
  );
};

export default SubmitCharacter;
