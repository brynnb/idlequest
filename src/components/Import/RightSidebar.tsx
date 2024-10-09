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

  .group-container {
    width: 113px;
    height: 135px;
    padding-left: 17px;
    position: absolute;
    top: 133px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .group-member {
    width: 100%;
    height: 27px;
    position: relative;
    font-size: 11px;
  }

  .health-bar-member {
    position: absolute;
    left: 3px;
    top: 15px;
    width: 110px;
  }

  .group-member-name {
    padding-left: 7px;
    white-space: nowrap;
    font-size: 9pt;
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
