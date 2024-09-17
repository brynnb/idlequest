import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { Item } from "../entities/Item";
import styles from "./GeneralInventorySlots.module.css";

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const getItemForSlot = (slotId: number): Item | undefined => {
    if (
      !characterProfile?.inventory ||
      !Array.isArray(characterProfile.inventory)
    ) {
      console.log("No inventory found");
      return undefined;
    }

    const item = characterProfile.inventory.find((item) => item.slotid === slotId);
    console.log(`Item for slot ${slotId}: ${item}`);
    return item;
  };

  return (
    <div className={styles.generalInventory}>
      {generalSlots.map((slot) => {
        const item = getItemForSlot(slot);
        return (
          <div key={slot} className={styles.slot}>
            {item ? (
              <img
                src={`/icons/${item.icon}.gif`}
                alt={item.Name}
                title={item.Name}
                className={styles.itemIcon}
              />
            ) : (
              <div className={styles.emptySlot} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GeneralInventorySlots;
