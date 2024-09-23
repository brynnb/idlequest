import React from "react";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";

const StoreDebugger: React.FC = () => {
  const characterCreatorStore = useCharacterCreatorStore();
  const playerCharacterStore = usePlayerCharacterStore();

  return (
    <div style={{ margin: "20px", padding: "20px", border: "1px solid #ccc" }}>
      {/* <h2>Zone Cache State:</h2>
      <pre>{JSON.stringify(zoneCache, null, 2)}</pre> */}
      {/* <h2>Character Creator Store State:</h2>
      <pre>{JSON.stringify(characterCreatorStore, null, 2)}</pre> */}
      <h2>Player Character Store State:</h2>
      <pre>{JSON.stringify(playerCharacterStore, null, 2)}</pre>
    </div>
  );
};

export default StoreDebugger;
