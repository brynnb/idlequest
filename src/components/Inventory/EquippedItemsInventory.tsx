import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import playerInventoryBackground from "/images/ui/playerinventorybackground.png";
import { InventorySlot } from "@entities/InventorySlot";
import { useInventoryActions } from "@hooks/useInventoryActions";

const EquippedItemsContainer = styled.div.attrs({
  className: "equippedItemsContainer",
})`
  position: absolute;
  right: 272px;
  top: 0px;
`;

const EquippedItems = styled.div.attrs({
  className: "equippedItems",
})`
  width: 663px;
  height: 588px;
  background-size: 100% 100%;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 35px;
  padding-bottom: 35px;
  box-sizing: border-box;
  background-image: url(${playerInventoryBackground});
`;

const Row = styled.div.attrs({
  className: "row",
})`
  display: flex;
  justify-content: flex-end;
  gap: 29px;
`;

const Slot = styled.div.attrs({
  className: "slot",
})`
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ItemIcon = styled.img.attrs({
  className: "itemIcon",
})`
  width: 80px;
  height: 80px;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const EquippedItemsInventory: React.FC = () => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();
  const { handleItemClick } = useInventoryActions();

  const equippedSlots = [
    [
      InventorySlot.Ear1,
      InventorySlot.Neck,
      InventorySlot.Face,
      InventorySlot.Head,
      InventorySlot.Ear2,
    ],
    [
      InventorySlot.Finger1,
      InventorySlot.Wrist1,
      InventorySlot.Arms,
      InventorySlot.Hands,
      InventorySlot.Wrist2,
      InventorySlot.Finger2,
    ],
    [
      InventorySlot.Shoulders,
      InventorySlot.Chest,
      InventorySlot.Back,
      InventorySlot.Waist,
      InventorySlot.Legs,
      InventorySlot.Feet,
    ],
    [
      InventorySlot.Primary,
      InventorySlot.Secondary,
      InventorySlot.Range,
      InventorySlot.Ammo,
    ],
  ];

  const getInventoryItemForSlot = (slotId: InventorySlot) => {
    return characterProfile?.inventory?.find(
      (item) => item.bag === 0 && item.slot === slotId
    );
  };

  return (
    <EquippedItemsContainer>
      <EquippedItems>
        {equippedSlots.map((row, rowIndex) => (
          <Row key={rowIndex}>
            {row.map((slot) => {
              const inventoryItem = getInventoryItemForSlot(slot);
              const itemDetails = inventoryItem?.itemDetails;

              return (
                <Slot
                  key={slot}
                  onMouseEnter={() => setHoveredItem(itemDetails || null)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick({ bag: 0, slot })}
                >
                  {itemDetails && (
                    <ItemIcon
                      src={`/icons/${itemDetails.icon}.gif`}
                      alt={itemDetails.name}
                      title={itemDetails.name}
                    />
                  )}
                </Slot>
              );
            })}
          </Row>
        ))}
      </EquippedItems>
    </EquippedItemsContainer>
  );
};

export default EquippedItemsInventory;
