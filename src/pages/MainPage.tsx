import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation() as { state?: { fromCreate?: boolean } };
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
      // If we just navigated here from the character creator, wait for
      // the server-pushed CHARACTER_STATE instead of bouncing back.
      if (location.state?.fromCreate) {
        return;
      }

      console.log("No character found, redirecting to /create");
      navigate("/create");
      return;
    }

    initializeZones();
  }, [characterProfile, navigate, initializeZones, location.state]);

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
