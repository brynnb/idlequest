import React from "react";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";

const SubmitCharacter: React.FC = () => {
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    attributes,
  } = useCharacterCreatorStore();
  const setCharacterProfile = usePlayerCharacterStore((state) => state.setCharacterProfile);

  const handleSubmit = () => {
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
      },
    };

    setCharacterProfile(newCharacterProfile);
    alert("Character created successfully!"); // You can replace this with a more user-friendly notification
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={
        !characterName ||
        !selectedRace ||
        !selectedClass ||
        !selectedDeity ||
        !selectedZone
      }
    >
      Create Character
    </button>
  );
};

export default SubmitCharacter;
