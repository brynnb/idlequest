import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { addItemToInventory } from "@utils/lootUtils";
import useGameStatusStore from "@stores/GameStatusStore";
import { MessageType } from "@stores/ChatStore";
import { InventorySlot } from "@entities/InventorySlot";

const PersonaView: React.FC = () => {
  const { characterProfile, setInventory } = usePlayerCharacterStore();
  const { addChatMessage } = useGameStatusStore();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.slotid === InventorySlot.Cursor
  );

  const handleClick = async () => {
    if (cursorItem?.itemDetails) {
      // Create a new inventory without the cursor item
      const inventoryWithoutCursor = characterProfile.inventory?.filter(
        (item) => item.slotid !== InventorySlot.Cursor
      ) || [];

      await addItemToInventory(
        cursorItem.itemDetails,
        {
          inventory: inventoryWithoutCursor,
          class: characterProfile.class,
          race: characterProfile.race,
        },
        {
          setInventory,
          addChatMessage: (message: string) =>
            addChatMessage(message, MessageType.LOOT),
        }
      );
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
