import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { InventorySlot } from "@entities/InventorySlot";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { getEquippableSlots } from "@utils/itemUtils";
import { InventoryKey } from "@entities/InventoryItem";

const PersonaView: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const { handleItemClick } = useInventoryActions();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
  );

  const handleClick = async () => {
    if (cursorItem?.itemDetails) {
      const slots = cursorItem.itemDetails.slots;
      if (slots) {
        const possibleSlots = getEquippableSlots(cursorItem.itemDetails);
        for (const slot of possibleSlots) {
          const key: InventoryKey = { bag: 0, slot: slot as InventorySlot };
          await handleItemClick(key);
          // If the cursor is now empty, we successfully placed the item
          const newCursorItem = characterProfile?.inventory?.find(
            (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
          );
          if (!newCursorItem) break;
        }
      }
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
