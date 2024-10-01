import React, { useEffect, useState } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./CursorInventorySlot.module.css";
import { InventorySlot } from "../entities/InventorySlot";
import { useDatabase } from "../hooks/useDatabase";

const CursorInventorySlot: React.FC = () => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { getById } = useDatabase();
  const [itemDetails, setItemDetails] = useState<any>(null);

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.slotid === InventorySlot.Cursor
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (cursorItem && cursorItem.itemid) {
        const details = await getById("items", cursorItem.itemid);
        setItemDetails(details);
      } else {
        setItemDetails(null);
      }
    };

    fetchItemDetails();
  }, [cursorItem, getById]);

  if (!cursorItem || !itemDetails) {
    return null;
  }

  return (
    <div
      className={styles.cursorSlot}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <img
        src={`/icons/${itemDetails.icon}.gif`}
        alt={itemDetails.Name}
        title={itemDetails.Name}
        className={styles.itemIcon}
        onMouseEnter={() => setHoveredItem(itemDetails)}
        onMouseLeave={() => setHoveredItem(null)}
      />
    </div>
  );
};

export default CursorInventorySlot;
