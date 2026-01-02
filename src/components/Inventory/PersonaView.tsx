import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { InventorySlot } from "@entities/InventorySlot";
import { useInventoryActions } from "@hooks/useInventoryActions";

const PersonaView: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const { handleAutoPlaceCursorItem } = useInventoryActions();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
  );

  const handleClick = async () => {
    if (cursorItem) {
      // Use loot-like logic: try to equip, then try general inventory
      await handleAutoPlaceCursorItem();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: "221px",
        height: "436px",
        backgroundColor: "#ffffff00",
        position: "absolute",
        right: "132px",
        top: "287px",
        transform: "translate(50%, -50%)",
        cursor: cursorItem ? "pointer" : "default",
        zIndex: 1000,
      }}
    />
  );
};

export default PersonaView;
