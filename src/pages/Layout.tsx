import styled from "styled-components";
import { Outlet, useLocation } from "react-router-dom";

interface MainContainerProps {
  $isCharacterCreation: boolean;
}

const MainContainer = styled.div<MainContainerProps>`
  display: grid;
  gap: 0px 0px;
  grid-auto-flow: row;
  margin: 50px auto;
  justify-items: center;
  align-items: center;
  width: 1440px;
  height: 1080px;
  position: relative;
  overflow: hidden;
  ${(props) =>
    props.$isCharacterCreation &&
    `
    background-image: url("/images/ui/charactercreation/charactercreatorbackground.png");
    background-size: 1440px 1080px;
    background-position: center;
    background-repeat: no-repeat;
  `}
`;

const Layout = () => {
  const location = useLocation();
  const isCharacterCreation = location.pathname === "/create";

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <MainContainer
      id="main"
      onContextMenu={handleContextMenu}
      $isCharacterCreation={isCharacterCreation}
    >
      <Outlet />
    </MainContainer>
  );
};

export default Layout;
