import { useEffect, useState } from "react";
import AddInventoryItem from "../components/Inventory/AddInventoryItem";
import DeleteAllInventory from "../components/Inventory/DeleteAllInventory";
import EquipAllItems from "../components/Inventory/EquipAllItems";
import EquippedItemsInventory from "../components/Inventory/EquippedItemsInventory";
import GameEngine from "../components/GameEngine";
import GeneralInventorySlots from "../components/Inventory/GeneralInventorySlots";
import ItemInformationDisplay from "../components/Inventory/ItemInformationDisplay";
import useGameStatusStore from "../stores/GameStatusStore";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import CursorInventorySlot from "../components/Inventory/CursorInventorySlot";
import DeleteItemOnCursorButton from "../components/Inventory/DeleteItemOnCursorButton";
import SellGeneralInventory from "../components/Inventory/SellGeneralInventory";
import PlayerCurrencyDisplay from "../components/Inventory/PlayerCurrencyDisplay";
import ZoneSelector from "../components/ZoneSelector";

const MainPage: React.FC = () => {
  const { hoveredItem } = usePlayerCharacterStore((state) => ({
    hoveredItem: state?.hoveredItem,
  })) || { hoveredItem: null };
  const { initializeZones } = useGameStatusStore();

  useEffect(() => {
    initializeZones();
  }, []);

  const [isRunning, setIsRunning] = useState(false);
  return (
    <>
      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      <GeneralInventorySlots />
      <EquippedItemsInventory />
      <AddInventoryItem />
      <DeleteAllInventory />
      <EquipAllItems />
      <DeleteItemOnCursorButton />
      <SellGeneralInventory />
      <CursorInventorySlot />
      <ZoneSelector />
      <PlayerCurrencyDisplay />
      <ItemInformationDisplay
        item={hoveredItem}
        isVisible={hoveredItem !== null}
        // isVisible={true}
      />
    </>
  );
};

export default MainPage;
