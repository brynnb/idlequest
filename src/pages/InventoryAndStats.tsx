import AddInventoryItem from "@components/Inventory/AddInventoryItem";
import DeleteAllInventory from "@components/Inventory/DeleteAllInventory";
import EquipAllItems from "@components/Inventory/EquipAllItems";
import EquippedItemsInventory from "@components/Inventory/EquippedItemsInventory";
import GeneralInventorySlots from "@components/Inventory/GeneralInventorySlots";
import ItemInformationDisplay from "@components/Inventory/ItemInformationDisplay";
import CursorInventorySlot from "@components/Inventory/CursorInventorySlot";
import DeleteItemOnCursorButton from "@components/Inventory/DeleteItemOnCursorButton";
import SellGeneralInventory from "@components/Inventory/SellGeneralInventory";
import PlayerCurrencyDisplay from "@components/Inventory/PlayerCurrencyDisplay";

const InventoryAndStats: React.FC = () => {
  return (
    <>
      <GeneralInventorySlots />
      <EquippedItemsInventory />
      <AddInventoryItem />
      <DeleteAllInventory />
      <EquipAllItems />
      <DeleteItemOnCursorButton />
      <SellGeneralInventory />
      <CursorInventorySlot />

      <PlayerCurrencyDisplay />
      <ItemInformationDisplay
        item={hoveredItem}
        isVisible={hoveredItem !== null}
        // isVisible={true}
      />
    </>
  );
};

export default InventoryAndStats;
