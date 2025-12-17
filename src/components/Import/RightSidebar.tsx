import styled from "styled-components";
import PlayerStats from "@components/Interface/PlayerStats";
import TargetBar from "./TargetBar";
import ActionButton from "@components/Interface/ActionButton";
import useGameStatusStore from "@stores/GameStatusStore";
import useGameScreenStore from "@stores/GameScreenStore";
import { useEffect, useState } from "react";
import { WorldSocket, OpCodes } from "@/net";
import useCharacterSelectStore from "@stores/CharacterSelectStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

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
  const { setScreen } = useGameScreenStore();
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
  const { setPendingSelectName } = useCharacterSelectStore();
  const { characterProfile } = usePlayerCharacterStore();

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
          onClick={async () => {
            // Set pending select name so character select auto-selects this character
            if (characterProfile?.name) {
              setPendingSelectName(characterProfile.name);
            }
            // Send Camp opcode to save character data before navigating
            await WorldSocket.sendMessage(OpCodes.Camp, null, null);
            setScreen("characterSelect");
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
