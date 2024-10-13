import React from "react";
import DeleteItemOnCursorButton from "./DeleteItemOnCursorButton";
import EquippedItemsInventory from "./EquippedItemsInventory";
import GeneralInventorySlots from "./GeneralInventorySlots";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import ActionButton from "@components/Interface/ActionButton";

const InventorySidebar: React.FC = () => {
  const { characterProfile, deleteItemOnCursor } = usePlayerCharacterStore();

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
    </>
  );
};

export default InventorySidebar;
