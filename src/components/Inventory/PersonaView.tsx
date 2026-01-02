import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { InventorySlot } from "@entities/InventorySlot";
import { WorldSocket, OpCodes } from "@/net";

const PersonaView: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
  );

  const handleClick = () => {
    if (cursorItem && WorldSocket.isConnected) {
      // Send to server - server handles the auto-equip/inventory logic
      WorldSocket.sendMessage(OpCodes.AutoPlaceCursorItem, null, null);
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
