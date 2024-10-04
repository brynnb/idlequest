import SpellBar from "./SpellBar";
import SystemOptions from "./SystemOptions";
import MacroButtons from "./MacroButtons";

const LeftSidebar = () => {
  return (
    <div className="left-sidebar marble-bg">
      <div className="left_sidebar_top">
        <SpellBar />
        <SystemOptions />
      </div>
      <div className="left_sidebar_bottom">
        <MacroButtons />
      </div>
    </div>
  );
};

export default LeftSidebar;