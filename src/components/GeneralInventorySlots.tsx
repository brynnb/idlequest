import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./GeneralInventorySlots.module.css";
import generalInventoryBackground from "/images/ui/generalinventoryslots.png";
import { InventorySlot } from "../entities/InventorySlot";

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile, setHoveredItem, moveItemToSlot, swapItems } =
    usePlayerCharacterStore();

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const getInventoryItemForSlot = (slotId: number) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  const handleItemClick = (slotId: number) => {
    const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);
    const currentSlotItem = getInventoryItemForSlot(slotId);
    if (currentSlotItem && cursorItem) {
      swapItems(currentSlotItem.slotid, cursorItem.slotid);
    } else if (cursorItem) {
      moveItemToSlot(InventorySlot.Cursor, slotId);
    } else {
      moveItemToSlot(slotId, InventorySlot.Cursor);
    }
  };

  return (
    <div className={styles.generalInventoryContainer}>
      <div
        className={styles.generalInventory}
        style={{ backgroundImage: `url(${generalInventoryBackground})` }}
      >
        {generalSlots.map((slot, index) => {
          const inventoryItem = getInventoryItemForSlot(slot);
          const itemDetails = inventoryItem?.itemDetails;

          const row = Math.floor(index / 2);
          const col = index % 2;

          return (
            <div
              key={slot}
              className={styles.slot}
              style={{
                position: "absolute",
                left: `${col * 50}%`,
                top: `${row * 25}%`,
                width: "50%",
                height: "25%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onMouseEnter={() => setHoveredItem(itemDetails || null)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(slot)}
            >
              {itemDetails && (
                <img
                  src={`/icons/${itemDetails.icon}.gif`}
                  alt={itemDetails.Name}
                  title={itemDetails.Name}
                  className={styles.itemIcon}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GeneralInventorySlots;
