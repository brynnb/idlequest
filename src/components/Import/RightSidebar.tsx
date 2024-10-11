import styled from "styled-components";
import PlayerStats from "/src/components/Interface/PlayerStats";
import GroupContainer from "./GroupContainer";
import TargetAndActions from "./TargetAndActions";

const StyledRightSidebar = styled.div.attrs({ className: "right-sidebar" })`
  right: 0px;
  position: absolute;
  top: 0px;
  width: 272px;
  height: 1080px;
  background-image: url("/images/rightsidebarblank.png");


`;

const RightSidebar = () => {
  return (
    <StyledRightSidebar>
        <PlayerStats />
        <GroupContainer />
        <TargetAndActions />
    </StyledRightSidebar>
  );
};

export default RightSidebar;
