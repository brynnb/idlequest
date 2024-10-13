import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getInventorySlotNames } from "@entities/InventorySlot";
import { InventorySlot } from "@entities/InventorySlot";
import { InventoryItem } from "@entities/InventoryItem";
import { Item } from "@entities/Item";

const EquipAllItems: React.FC = () => {
  const { characterProfile, setInventory, getItemDetails } =
    usePlayerCharacterStore();

  const handleEquipAll = async () => {
    const newInventory = [...characterProfile.inventory];

    const generalItems: InventoryItem[] = newInventory.filter(
      (item) => item.slotid && item.slotid > 22
    );

    for (const inventoryItem of generalItems) {
      const itemDetails = inventoryItem.itemDetails;

      if (itemDetails && itemDetails.slots !== undefined) {
        const possibleSlots = getInventorySlotNames(itemDetails.slots);

        for (const slotName of possibleSlots) {
          const slotId = Object.entries(InventorySlot).find(
            ([key, value]) => key.replace(/\d+/g, "").toUpperCase() === slotName
          )?.[1];

          if (slotId >= 0 && slotId <= 22) {
            const isSlotEmpty = !newInventory.some(
              (invItem) => invItem.slotid === slotId
            );

            if (isSlotEmpty) {
              inventoryItem.slotid = slotId;
              break;
            }
          }
        }
      }
    }

    setInventory(newInventory);
  };

  return <button onClick={handleEquipAll}>Equip All Items</button>;
};

export default EquipAllItems;
