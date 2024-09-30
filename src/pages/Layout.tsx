import { Link, Outlet } from "react-router-dom";
import ResetGameButton from "../components/ResetGameButton";
import StoreDebugger from "../components/StoreDebugger";

const Layout = () => {
  return (
    <>
      <div id="main">
        <h1>IdleQuest</h1>
        <Link to="/create">
          <ResetGameButton />
        </Link>
        <Outlet />
        <StoreDebugger />
      </div>
    </>
  );
};

export default Layout;
