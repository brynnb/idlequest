import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";

const ResetGameButton: React.FC = () => {
  const resetPlayerCharacter = usePlayerCharacterStore(
    (state) => state.setCharacterProfile
  );
  const resetCharacterCreator = useCharacterCreatorStore(
    (state) => state.resetStore
  );

  const handleReset = () => {
    // Reset PlayerCharacterStore
    resetPlayerCharacter({
      name: "",
      race: null,
      class: null,
      deity: null,
      startingZone: null,
      attributes: {
        str: 0,
        sta: 0,
        cha: 0,
        dex: 0,
        int: 0,
        agi: 0,
        wis: 0,
      },
      inventory: [], // Reset inventory to an empty array
    });

    // Reset CharacterCreatorStore
    resetCharacterCreator();

    console.log("Game has been reset!");
  };

  return (
    <button
      onClick={handleReset}
      style={{
        backgroundColor: "red",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      Start New Game
    </button>
  );
};

export default ResetGameButton;
