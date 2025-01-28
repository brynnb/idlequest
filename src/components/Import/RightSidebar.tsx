import styled from "styled-components";
import PlayerStats from "../Interface/PlayerStats";
import TargetBar from "./TargetBar";
import ActionButton from "../Interface/ActionButton";
import useGameStatusStore from "@stores/GameStatusStore";

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
  const {
    isRunning,
    toggleRunning,
    isMapOpen,
    toggleMap,
    isNoteOpen,
    toggleNote,
    autoSellEnabled,
    toggleAutoSell,
  } = useGameStatusStore();

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
          onClick={toggleNote}
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
          onClick={() => {}}
          marginBottom={marginBottomForBottomButtons}
        />
        <ActionButton
          text="Sit"
          onClick={() => {}}
          marginBottom={marginBottomForBottomButtons}
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
