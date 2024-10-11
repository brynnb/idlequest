import styled from "styled-components";
import { Link, Outlet } from "react-router-dom";
import ResetGameButton from "../components/ResetGameButton";
import StoreDebugger from "../components/StoreDebugger";

const MainContainer = styled.div`
  display: grid;
  gap: 0px 0px;
  grid-auto-flow: row;
  margin: 50px auto;
  justify-items: center;
  align-items: center;
  background-image: url("/static/everbitica/images/classic_full_screen_bg_blank.png");
  width: 800px;
  height: 600px;
  position: relative;
  overflow: hidden;
`;

const Layout = () => {
  return (
    <MainContainer id="main">
      {/* <Link to="/create">
        <ResetGameButton />
      </Link> */}
      <Outlet />
      {/* <StoreDebugger /> */}
    </MainContainer>
  );
};

export default Layout;
