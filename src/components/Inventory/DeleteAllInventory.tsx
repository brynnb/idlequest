import React from "react";
import usePlayerCharacterStore from "@stores/playercharacterStore";

const DeleteAllInventory: React.FC = () => {
  const clearInventory = usePlayerCharacterStore(
    (state) => state.clearInventory
  );

  const handleDeleteAll = () => {
    clearInventory();
  };

  return <button onClick={handleDeleteAll}>Delete All Inventory</button>;
};

export default DeleteAllInventory;
