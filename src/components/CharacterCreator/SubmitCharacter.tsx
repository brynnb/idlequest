import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useCharacterSelectStore from "@stores/CharacterSelectStore";
import {
  WorldSocket,
  OpCodes,
  CharCreate,
  Int,
  CharacterSelect,
  capnpToPlainObject,
} from "@/net";
import SelectionButton from "../Interface/SelectionButton";

const SubmitCharacter: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setCharacters, setPendingSelectName } = useCharacterSelectStore();
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

    // Register handler for updated character list after creation
    WorldSocket.registerOpCodeHandler(
      OpCodes.SendCharInfo,
      CharacterSelect,
      (charSelect) => {
        console.log("Received updated character list after creation");
        const plainData = capnpToPlainObject(charSelect);
        setCharacters(plainData.characters || []);
      }
    );

    // Register handler for the server's response
    WorldSocket.registerOpCodeHandler(
      OpCodes.ApproveName_Server,
      Int,
      (data) => {
        setLoading(false);
        if (data.value === 1) {
          // Success - navigate to character select to pick the new character
          console.log("Character created successfully");
          // Set the pending name so the store auto-selects this character
          setPendingSelectName(characterName);
          resetStore();
          navigate("/characterselect");
        } else {
          // Name rejected (likely duplicate)
          resetStore();
          window.alert(
            "That name is already taken. Please choose a different character name."
          );
        }
      }
    );

    // Build the CharCreate message matching the Cap'n Proto schema
    const charData = {
      name: characterName,
      race: selectedRace.id,
      charClass: selectedClass.id,
      deity: selectedDeity.id,
      startZone: selectedZone.zoneidnumber,
      gender: 0, // Default gender, could be added to character creator
      face: 0, // Default face, could be added to character creator
      str: attributes.str + attributes.base_str,
      sta: attributes.sta + attributes.base_sta,
      cha: attributes.cha + attributes.base_cha,
      dex: attributes.dex + attributes.base_dex,
      intel: attributes.int + attributes.base_int,
      agi: attributes.agi + attributes.base_agi,
      wis: attributes.wis + attributes.base_wis,
      tutorial: 0,
      haircolor: 0,
      beardcolor: 0,
      beard: 0,
      hairstyle: 0,
      eyecolor1: 0,
      eyecolor2: 0,
    };

    console.log("Sending CharCreate:", charData);

    // Send the Cap'n Proto message via datagram (server expects Cap'n Proto on datagrams)
    try {
      await WorldSocket.sendMessage(
        OpCodes.CharacterCreate,
        CharCreate,
        charData
      );
    } catch (error) {
      console.error("Failed to send CharCreate:", error);
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
