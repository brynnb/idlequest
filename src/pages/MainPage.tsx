import { useEffect, useState } from "react";
import useGameScreenStore from "@stores/GameScreenStore";
import AddInventoryItem from "@components/Inventory/AddInventoryItem";
import DeleteAllInventory from "@components/Inventory/DeleteAllInventory";
import EquipAllItems from "@components/Inventory/EquipAllItems";
import EquippedItemsInventory from "@components/Inventory/EquippedItemsInventory";
import GameEngine from "@components/GameEngine";
import GeneralInventorySlots from "@components/Inventory/GeneralInventorySlots";
import ItemInformationDisplay from "@components/Inventory/ItemInformationDisplay";
import useGameStatusStore from "@stores/GameStatusStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import CursorInventorySlot from "@components/Inventory/CursorInventorySlot";
import DeleteItemOnCursorButton from "@components/Inventory/DeleteItemOnCursorButton";
import SellGeneralInventory from "@components/Inventory/SellGeneralInventory";
import PlayerCurrencyDisplay from "@components/Inventory/PlayerCurrencyDisplay";
import ZoneSelector from "@components/ZoneSelector";
import PlayerStats from "@components/Interface/PlayerStats";
import RightSidebar from "@components/Import/RightSidebar";
import VideoBackground from "@components/Import/VideoBackground";
import Chatbox from "@components/Import/Chatbox";
import LeftSidebar from "@components/Import/LeftSidebar";
import InventoryAndStats from "./InventoryAndStats";
import InventoryLayout from "@components/Inventory/InventoryLayout";
import MapAndZoneSelection from "@components/Interface/MapAndZoneSelection";
import Spellbook from "@/components/Interface/Spellbook";
import NoteDisplay from "@/components/Interface/NoteDisplay";
import QuestDisplay from "@/components/Interface/QuestDisplay";
import DiceRoller from "@/components/DiceRoller";
const MainPage: React.FC = () => {
  const { setScreen } = useGameScreenStore();
  const { hoveredItem, characterProfile } = usePlayerCharacterStore(
    (state) => ({
      hoveredItem: state?.hoveredItem,
      characterProfile: state?.characterProfile,
    })
  ) || { hoveredItem: null, characterProfile: null };
  const {
    initializeZones,
    isInventoryOpen,
    isMapOpen,
    isSpellbookOpen,
    isNoteOpen,
  } = useGameStatusStore();

  useEffect(() => {
    // Redirect to character creation if no character exists
    if (!characterProfile?.id && !characterProfile?.name) {
      console.log("No character found, redirecting to character create");
      setScreen("characterCreate");
      return;
    }

    initializeZones();
  }, [characterProfile, setScreen, initializeZones]);

  const [isRunning, setIsRunning] = useState(false);
  return (
    <>
      {/* <DiceRoller /> */}
      <Chatbox />
      <VideoBackground />
      {/* <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} /> */}
      <LeftSidebar />
      <RightSidebar />
      {isInventoryOpen && (
        <>
          <InventoryLayout />
        </>
      )}
      <CursorInventorySlot />
      {/* <ZoneSelector /> */}
      {/* <PlayerCurrencyDisplay /> */}
      {/* <ItemInformationDisplay
        item={hoveredItem}
        isVisible={hoveredItem !== null}
        // isVisible={true}
      /> */}
      {isMapOpen && <MapAndZoneSelection />}
      {isSpellbookOpen && <Spellbook />}
      {isNoteOpen && <QuestDisplay />}
    </>
  );
};

export default MainPage;
