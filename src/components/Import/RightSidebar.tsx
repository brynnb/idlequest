import PlayerStats from "./PlayerStats";
import GroupContainer from "./GroupContainer";
import TargetAndActions from "./TargetAndActions";

const RightSidebar = () => {
  return (
    <div className="right-sidebar">
      <div className="right_sidebar_top marble-bg">
        <PlayerStats />
        <GroupContainer />
        <TargetAndActions />
      </div>
      <div className="right_sidebar_bottom marble-bg"></div>
    </div>
  );
};

export default RightSidebar;