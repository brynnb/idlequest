import styled from "styled-components";
import { Outlet } from "react-router-dom";
import useGameScreenStore from "@stores/GameScreenStore";

interface MainContainerProps {
  $backgroundType: "login" | "characterCreation" | "none";
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
    props.$backgroundType === "login" &&
    `
    background-image: url("/images/ui/login/loginbackground.png");
    background-size: 1440px 1080px;
    background-position: center;
    background-repeat: no-repeat;
  `}
  ${(props) =>
    props.$backgroundType === "characterCreation" &&
    `
    background-image: url("/images/ui/charactercreation/charactercreatorbackground.png");
    background-size: 1440px 1080px;
    background-position: center;
    background-repeat: no-repeat;
  `}
`;

const Layout = () => {
  const { currentScreen } = useGameScreenStore();
  const isLogin = currentScreen === "login";
  const isCharacterCreation =
    currentScreen === "characterCreate" || currentScreen === "characterSelect";

  const backgroundType = isLogin
    ? "login"
    : isCharacterCreation
    ? "characterCreation"
    : "none";

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <MainContainer
        id="main"
        onContextMenu={handleContextMenu}
        $backgroundType={backgroundType}
      >
        <Outlet />
      </MainContainer>
    </>
  );
};

export default Layout;
