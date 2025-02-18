import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useChatStore from "@stores/ChatStore";
import { MessageType } from "@stores/ChatStore";
import { InventorySlot } from "@entities/InventorySlot";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { isSlotAvailableForItem } from "@utils/itemUtils";

const PersonaView: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const { addMessage } = useChatStore();
  const { handleItemClick } = useInventoryActions();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.slotid === InventorySlot.Cursor
  );

  const handleClick = async () => {
    if (
      cursorItem?.itemDetails &&
      characterProfile.class &&
      characterProfile.race
    ) {
      // If it's a bag, try to place it in general inventory slots
      if (cursorItem.itemDetails.itemclass === 1) {
        for (let slot = 23; slot <= 30; slot++) {
          const isSlotTaken = characterProfile.inventory?.some(
            (item) => item.slotid === slot
          );

          if (
            !isSlotTaken &&
            isSlotAvailableForItem(
              cursorItem,
              slot as InventorySlot,
              characterProfile.class,
              characterProfile.race,
              characterProfile.inventory || []
            )
          ) {
            await handleItemClick(slot as InventorySlot);
            break;
          }
        }
      } else {
        // For non-bag items, check equipment slots
        const slots = cursorItem.itemDetails.slots;
        if (slots) {
          for (let slot = 0; slot <= 22; slot++) {
            const isSlotTaken = characterProfile.inventory?.some(
              (item) => item.slotid === slot
            );

            if (
              !isSlotTaken &&
              isSlotAvailableForItem(
                cursorItem,
                slot as InventorySlot,
                characterProfile.class,
                characterProfile.race,
                characterProfile.inventory || []
              )
            ) {
              await handleItemClick(slot as InventorySlot);
              break;
            }
          }
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
