import React from "react";
import usePlayerCharacterStore from "../../stores/PlayerCharacterStore";
import { InventorySlot } from "../../entities/InventorySlot";

const DeleteItemOnCursorButton: React.FC = () => {
  const { characterProfile, deleteItemOnCursor } = usePlayerCharacterStore();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.slotid === InventorySlot.Cursor
  );

  if (!cursorItem) {
    return null;
  }

  return <button onClick={deleteItemOnCursor}>Delete Item on Cursor</button>;
};

export default DeleteItemOnCursorButton;
