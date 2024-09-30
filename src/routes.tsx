import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import MainPage from "./pages/MainPage";
import ErrorPage from "./pages/ErrorPage";
import CharacterCreatorPage from "./pages/CharacterCreatorPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <MainPage /> },
      { path: "/create", element: <CharacterCreatorPage /> },
    ],
  },
]);

export default router;
