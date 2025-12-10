import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import MainPage from "./pages/MainPage";
import ErrorPage from "./pages/ErrorPage";
import CharacterCreatorPage from "./pages/CharacterCreatorPage";
import LoginPage from "./pages/LoginPage";
import CharacterSelectPage from "./pages/CharacterSelectPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "/game", element: <MainPage /> },
      { path: "/characterselect", element: <CharacterSelectPage /> },
      { path: "/create", element: <CharacterCreatorPage /> },
    ],
  },
]);

export default router;
