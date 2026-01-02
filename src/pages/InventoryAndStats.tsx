import AddInventoryItem from "@components/Inventory/AddInventoryItem";
import DeleteAllInventory from "@components/Inventory/DeleteAllInventory";
import EquipAllItems from "@components/Inventory/EquipAllItems";
import EquippedItemsInventory from "@components/Inventory/EquippedItemsInventory";
import GeneralInventorySlots from "@components/Inventory/GeneralInventorySlots";
import ItemInformationDisplay from "@components/Inventory/ItemInformationDisplay";
import CursorInventorySlot from "@components/Inventory/CursorInventorySlot";
import PlayerCurrencyDisplay from "@components/Inventory/PlayerCurrencyDisplay";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

const InventoryAndStats: React.FC = () => {
  const { hoveredItem } = usePlayerCharacterStore();

  return (
    <>
      <GeneralInventorySlots />
      <EquippedItemsInventory />
      <AddInventoryItem />
      <DeleteAllInventory />
      <EquipAllItems />
      <CursorInventorySlot />

      <PlayerCurrencyDisplay />
      <ItemInformationDisplay
        item={hoveredItem}
        isVisible={hoveredItem !== null}
      />
    </>
  );
};

export default InventoryAndStats;
