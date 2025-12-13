import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import PlayerStats from "@components/Interface/PlayerStats";
import TargetBar from "./TargetBar";
import ActionButton from "@components/Interface/ActionButton";
import useGameStatusStore from "@stores/GameStatusStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { useEffect, useState } from "react";

const StyledRightSidebar = styled.div.attrs({ className: "right-sidebar" })`
  right: 0px;
  position: absolute;
  top: 0px;
  width: 272px;
  height: 1080px;
  background-image: url("/images/rightsidebarblank.png");
`;

const TopActionButtonContainer = styled.div.attrs({
  className: "action-button-container",
})`
  position: absolute;
  top: 570px;
  margin-left: 22px;
`;

const BottomActionButtonContainer = styled.div.attrs({
  className: "action-button-container",
})`
  position: absolute;
  top: 750px;
  margin-left: 22px;
`;

const marginBottomForBottomButtons = "12px";

const RightSidebar = () => {
  const navigate = useNavigate();
  const {
    isRunning,
    toggleRunning,
    isMapOpen,
    toggleMap,
    isNoteOpen,
    toggleNote,
    updateCurrentZoneNPCs,
    autoSellEnabled,
    toggleAutoSell,
    isMuted,
    toggleMute,
  } = useGameStatusStore();

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      document.removeEventListener("click", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  const handleQuestsClick = async () => {
    // Capture previous state so we know if we're opening or closing the pane
    const wasOpen = isNoteOpen;
    toggleNote();
    // When transitioning from closed -> open, refresh NPCs for the current zone
    if (!wasOpen) {
      try {
        await updateCurrentZoneNPCs();
      } catch (e) {
        // Fail silently in UI; fallback logic inside the store will handle errors
        console.error("Failed to refresh zone NPCs on Quests click:", e);
      }
    }
  };

  return (
    <StyledRightSidebar>
      <PlayerStats />
      <TargetBar />
      <TopActionButtonContainer>
        <ActionButton text="Abilities" onClick={() => {}} />
        <ActionButton
          text="Combat"
          onClick={toggleRunning}
          isPressed={isRunning}
          isToggleable={true}
        />
        <ActionButton
          text="Quests"
          onClick={handleQuestsClick}
          isPressed={isNoteOpen}
          isToggleable={true}
        />
      </TopActionButtonContainer>
      <BottomActionButtonContainer>
        <ActionButton
          text="Map"
          onClick={toggleMap}
          isPressed={isMapOpen}
          isToggleable={true}
          marginBottom={marginBottomForBottomButtons}
        />
        <ActionButton
          text="Invite"
          onClick={() => {}}
          marginBottom={marginBottomForBottomButtons}
        />
        <ActionButton
          text="Disband"
          onClick={() => {}}
          marginBottom={marginBottomForBottomButtons}
        />
        <ActionButton
          text="Camp"
          onClick={() => {
            // Log inventory on camp
            const inventory =
              usePlayerCharacterStore.getState().characterProfile?.inventory ||
              [];
            const charName =
              usePlayerCharacterStore.getState().characterProfile?.name ||
              "Unknown";
            console.log(`=== INVENTORY [CAMP] for ${charName} ===`);
            inventory.forEach((item) => {
              console.log(
                `  bag=${item.bag}, slot=${item.slot}: ${
                  item.itemDetails?.name || "Unknown"
                }`
              );
            });
            console.log(
              `=== END INVENTORY [CAMP] (${inventory.length} items) ===`
            );

            console.log("Camp clicked, navigating to /characterselect");
            navigate("/characterselect");
          }}
          marginBottom={marginBottomForBottomButtons}
        />
        <ActionButton
          text="Mute"
          onClick={toggleMute}
          isPressed={isMuted}
          isToggleable={true}
          marginBottom={marginBottomForBottomButtons}
          tooltip="Click anywhere to start audio"
          showTooltip={!isMuted && !hasInteracted}
        />
        <ActionButton
          text="AutoSell"
          onClick={toggleAutoSell}
          isPressed={autoSellEnabled}
          isToggleable={true}
          marginBottom={marginBottomForBottomButtons}
        />
      </BottomActionButtonContainer>
    </StyledRightSidebar>
  );
};

export default RightSidebar;
