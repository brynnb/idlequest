import styled from "styled-components";
import PlayerStats from "/src/components/Interface/PlayerStats";
import GroupContainer from "./GroupContainer";
import TargetAndActions from "./TargetAndActions";

const StyledRightSidebar = styled.div`
  right: 0px;
  position: absolute;
  top: 0px;
  width: 151px;
  height: 600px;

  .right_sidebar_top {
    position: absolute;
    top: 0;
    width: 100%;
  }

  .right_sidebar_bottom {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
`;

const RightSidebar = () => {
  return (
    <StyledRightSidebar>
      <div className="right_sidebar_top marble-bg">
        <PlayerStats />
        <GroupContainer />
        <TargetAndActions />
      </div>
      <div className="right_sidebar_bottom marble-bg"></div>
    </StyledRightSidebar>
  );
};

export default RightSidebar;
