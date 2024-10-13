import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";

const ResetGameButton: React.FC = () => {
  const setPlayerCharacter = usePlayerCharacterStore(
    (state) => state.setCharacterProfile
  );
  const resetCharacterCreator = useCharacterCreatorStore(
    (state) => state.resetStore
  );

  const handleReset = () => {
    // Reset PlayerCharacterStore with an empty object instead of null
    setPlayerCharacter({});

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
