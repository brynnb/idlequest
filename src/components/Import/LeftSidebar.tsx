import styled from 'styled-components';
import SpellBar from "./SpellBar";
import SystemOptions from "./SystemOptions";
import MacroButtons from "./MacroButtons";

const LeftSidebarContainer = styled.div.attrs({ className: 'marble-bg' })`
  position: absolute;
  left: 0;
  top: 0;
  width: 268px;
  height: 1080px;
  background-image: url('/images/leftsidebarblank.png');

  
`;

const TopSection = styled.div.attrs({ className: 'left-sidebar-top-section' })`
  position: absolute;
  left: 0;
  top: 0px;
  height: 387px;
  width: 100%;
`;

const BottomSection = styled.div.attrs({ className: 'left-sidebar-bottom-section' })`
position: absolute;
top:695px;
left: 35px

`;

const LeftSidebar = () => {
  return (
    <LeftSidebarContainer>
      <TopSection>
        <SpellBar />
        <SystemOptions />
      </TopSection>
      <BottomSection>
        <MacroButtons />
      </BottomSection>
    </LeftSidebarContainer>
  );
};

export default LeftSidebar;