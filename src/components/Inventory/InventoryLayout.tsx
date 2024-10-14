import React from "react";
import EquippedItemsInventory from "./EquippedItemsInventory";
import GeneralInventorySlots from "./GeneralInventorySlots";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import ActionButton from "@components/Interface/ActionButton";
import useGameStatusStore from "@stores/GameStatusStore";
import ItemInformationDisplay from "@components/Inventory/ItemInformationDisplay";
import PlayerCurrencyDisplay from "./PlayerCurrencyDisplay";
import StatInfoBar from "./StatInfoBar";

const InventorySidebar: React.FC = () => {
  const { deleteItemOnCursor, hoveredItem } = usePlayerCharacterStore();
  const { toggleInventory } = useGameStatusStore();

  return (
    <>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "272px",
          height: "1080px",
          backgroundImage: 'url("/images/ui/rightsidebarinventory.png")',
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />
      <EquippedItemsInventory />
      <GeneralInventorySlots />
      <ActionButton
        onClick={deleteItemOnCursor}
        text="Destroy"
        customCSS={`position: absolute; bottom: 513px; right: 50px; z-index: 1000; width: 170px;`}
      />
      <ActionButton
        text="Done"
        onClick={toggleInventory}
        customCSS={`position: absolute; bottom: 15px; right: 75px; z-index: 1000; width: 120px;`}
      />
      <ItemInformationDisplay
        item={hoveredItem}
        // isVisible={hoveredItem !== null}
        isVisible={true}
      />
      <PlayerCurrencyDisplay />
      <StatInfoBar />
    </>
  );
};

export default InventorySidebar;
