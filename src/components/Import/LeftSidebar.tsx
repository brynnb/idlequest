import styled from 'styled-components';
import SpellBar from "./SpellBar";
import SystemOptions from "./SystemOptions";
import MacroButtons from "./MacroButtons";

const SidebarContainer = styled.div.attrs({ className: 'marble-bg' })`
  position: absolute;
  left: 0;
  top: 0;
  width: 149px;
  height: 600px;
`;

const TopSection = styled.div.attrs({ className: 'left-sidebar-top-section' })`
  position: absolute;
  left: 0;
  top: 0px;
  height: 387px;
  width: 100%;
`;

const BottomSection = styled.div.attrs({ className: 'left-sidebar-bottom-section' })``;

const LeftSidebar = () => {
  return (
    <SidebarContainer>
      <TopSection>
        <SpellBar />
        <SystemOptions />
      </TopSection>
      <BottomSection>
        <MacroButtons />
      </BottomSection>
    </SidebarContainer>
  );
};

export default LeftSidebar;