import { useEffect } from "react";
import useGameScreenStore from "@stores/GameScreenStore";
import useGameStatusStore from "@stores/GameStatusStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import CursorInventorySlot from "@components/Inventory/CursorInventorySlot";
import RightSidebar from "@components/Import/RightSidebar";
import VideoBackground from "@components/Import/VideoBackground";
import Chatbox from "@components/Import/Chatbox";
import LeftSidebar from "@components/Import/LeftSidebar";
import InventoryLayout from "@components/Inventory/InventoryLayout";
import MapAndZoneSelection from "@components/Interface/MapAndZoneSelection";
import Spellbook from "@/components/Interface/Spellbook";
import QuestDisplay from "@/components/Interface/QuestDisplay";
import AbilitiesDisplay from "@/components/Interface/AbilitiesDisplay";
const MainPage: React.FC = () => {
  const { setScreen } = useGameScreenStore();
  const { characterProfile } = usePlayerCharacterStore((state) => ({
    characterProfile: state?.characterProfile,
  })) || { characterProfile: null };
  const {
    initializeZones,
    isInventoryOpen,
    isMapOpen,
    isSpellbookOpen,
    isNoteOpen,
    isAbilitiesOpen,
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
      {isAbilitiesOpen && <AbilitiesDisplay />}
    </>
  );
};

export default MainPage;
