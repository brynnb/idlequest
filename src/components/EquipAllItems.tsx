import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { getInventorySlotNames } from "../entities/InventorySlot";
import { InventorySlot } from "../entities/InventorySlot";
import { InventoryItem } from "../entities/InventoryItem";
import { Item } from "../entities/Item";

const EquipAllItems: React.FC = () => {
  const { characterProfile, setInventory, getItemDetails } =
    usePlayerCharacterStore();

  const handleEquipAll = async () => {
    console.log("Starting equip all process");
    const newInventory = [...characterProfile.inventory];

    console.log("Current inventory:", newInventory);

    // Get all items in general inventory (slots > 22)
    const generalItems: InventoryItem[] = newInventory.filter(
      (item) => item.slotid && item.slotid > 22
    );
    console.log("Items in general inventory:", generalItems);

    for (const inventoryItem of generalItems) {
      console.log(`Processing inventory item in slot: ${inventoryItem.slotid}`);

      // Fetch the associated Item if not already loaded
      const itemDetails = inventoryItem.itemDetails;

      if (itemDetails && itemDetails.slots !== undefined) {
        console.log(
          `Item details: ${itemDetails.name} (ID: ${itemDetails.id})`
        );
        console.log(`Item slots bitmask: ${itemDetails.slots}`);

        const possibleSlots = getInventorySlotNames(itemDetails.slots);
        console.log(`Possible slots for item: ${possibleSlots.join(", ")}`);

        for (const slotName of possibleSlots) {
          const slotId = Object.entries(InventorySlot).find(
            ([key, value]) => key.replace(/\d+/g, "").toUpperCase() === slotName
          )?.[1];
          console.log(`Checking slot: ${slotName} (ID: ${slotId})`);

          // Check if the slot is between 0 and 22 (equipped slots)
          if (slotId >= 0 && slotId <= 22) {
            console.log(`Slot ${slotName} is a valid equipped slot`);
            const isSlotEmpty = !newInventory.some(
              (invItem) => invItem.slotid === slotId
            );

            if (isSlotEmpty) {
              console.log(`Slot ${slotName} is empty. Moving item.`);
              // Move item to this empty slot
              const oldSlot = inventoryItem.slotid;
              inventoryItem.slotid = slotId;
              console.log(`Moved item from slot ${oldSlot} to slot ${slotId}`);
              break; // Stop checking other slots for this item
            } else {
              console.log(`Slot ${slotName} is occupied. Checking next slot.`);
            }
          } else {
            console.log(
              `Slot ${slotName} is not a valid equipped slot. Skipping.`
            );
          }
        }
      } else {
        console.log(
          `Item details not found or slots information missing for item ID: ${inventoryItem.itemid}`
        );
      }
    }

    console.log("Final inventory arrangement:", newInventory);
    // Update the inventory
    setInventory(newInventory);
    console.log("Inventory updated in store");
  };

  return <button onClick={handleEquipAll}>Equip All Items</button>;
};

export default EquipAllItems;
