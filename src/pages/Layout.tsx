import styled from "styled-components";
import { Link, Outlet } from "react-router-dom";
import ResetGameButton from "@components/ResetGameButton";
import StoreDebugger from "@components/StoreDebugger";

const MainContainer = styled.div`
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
  background-image: url("/images/ui/charactercreation/charactercreatorbackground.png");
  background-size: 1440px 1080px;
  background-position: center;
  background-repeat: no-repeat;
`;

const Layout = () => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <MainContainer id="main" onContextMenu={handleContextMenu}>
      {/* <Link to="/create">
        <ResetGameButton />
      </Link> */}
      <Outlet />
      {/* <StoreDebugger /> */}
    </MainContainer>
  );
};

export default Layout;
