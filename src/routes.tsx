import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import MainPage from "./pages/MainPage";
import ErrorPage from "./pages/ErrorPage";
import CharacterCreatorPage from "./pages/CharacterCreatorPage";
import LoginPage from "./pages/LoginPage";
import CharacterSelectPage from "./pages/CharacterSelectPage";
import StaticDataGate from "./components/StaticDataGate";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LoginPage /> },
      {
        path: "/game",
        element: (
          <StaticDataGate>
            <MainPage />
          </StaticDataGate>
        ),
      },
      {
        path: "/characterselect",
        element: (
          <StaticDataGate>
            <CharacterSelectPage />
          </StaticDataGate>
        ),
      },
      {
        path: "/create",
        element: (
          <StaticDataGate>
            <CharacterCreatorPage />
          </StaticDataGate>
        ),
      },
    ],
  },
]);

export default router;
