import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

const StoreDebugger: React.FC = () => {
  const playerCharacterStore = usePlayerCharacterStore();

  return (
    <div style={{ margin: "20px", padding: "20px", border: "1px solid #ccc" }}>
      {/* <h2>Game Status Store State:</h2>
      <pre>{JSON.stringify(gameStatusStore, null, 2)}</pre> */}

      <h2>Player Character Store State:</h2>
      <pre>{JSON.stringify(playerCharacterStore, null, 2)}</pre>

      {/* <h2>Character Creator Store State:</h2>
      <pre>{JSON.stringify(characterCreatorStore, null, 2)}</pre> */}
    </div>
  );
};

export default StoreDebugger;
