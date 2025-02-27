import React, { useEffect, useState } from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { InventorySlot } from "@entities/InventorySlot";
import { useDatabase } from "@hooks/useDatabase";

const CursorSlot = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
`;

const ItemIcon = styled.img`
  width: 60px;
  height: 60px;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

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
    <CursorSlot
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <ItemIcon
        src={`/icons/${itemDetails.icon}.gif`}
        alt={itemDetails.name}
        title={itemDetails.name}
        onMouseEnter={() => setHoveredItem(itemDetails)}
        onMouseLeave={() => setHoveredItem(null)}
      />
    </CursorSlot>
  );
};

export default CursorInventorySlot;
