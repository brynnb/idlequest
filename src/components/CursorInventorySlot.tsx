import React, { useEffect, useState } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./CursorInventorySlot.module.css";
import { InventorySlot } from "../entities/InventorySlot";

const CursorInventorySlot: React.FC = () => {
  const { characterProfile, setHoveredItem, moveItemToSlot } = usePlayerCharacterStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.slotid === InventorySlot.Cursor
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleItemClick = () => {
    if (cursorItem) {
      const element = document.elementFromPoint(position.x, position.y) as HTMLElement;
      const slotId = parseInt(element.getAttribute("data-slot-id") || "-1", 10);
      
      if (slotId !== -1 && slotId !== InventorySlot.Cursor) {
        moveItemToSlot(cursorItem.id, slotId);
      }
    }
  };

  if (!cursorItem) {
    return null;
  }

  return (
    <div
      className={styles.cursorSlot}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <img
        src={`/icons/${cursorItem.itemDetails.icon}.gif`}
        alt={cursorItem.itemDetails.Name}
        title={cursorItem.itemDetails.Name}
        className={styles.itemIcon}
        style={{
          pointerEvents: "auto",
        }}
        onClick={handleItemClick}
        onMouseEnter={() => setHoveredItem(cursorItem.itemDetails)}
        onMouseLeave={() => setHoveredItem(null)}
      />
    </div>
  );
};

export default CursorInventorySlot;