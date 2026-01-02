import useGameScreenStore from "@stores/GameScreenStore";
import LoginPage from "@/pages/LoginPage";
import CharacterSelectPage from "@/pages/CharacterSelectPage";
import CharacterCreatorPage from "@/pages/CharacterCreatorPage";
import MainPage from "@/pages/MainPage";
import StaticDataGate from "./StaticDataGate";
import DevPanel from "./Interface/DevPanel";

const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === "true";

const ScreenRouter = () => {
  const { currentScreen } = useGameScreenStore();

  let content;
  switch (currentScreen) {
    case "login":
      content = <LoginPage />;
      break;
    case "characterSelect":
      content = (
        <StaticDataGate>
          <CharacterSelectPage />
        </StaticDataGate>
      );
      break;
    case "characterCreate":
      content = (
        <StaticDataGate>
          <CharacterCreatorPage />
        </StaticDataGate>
      );
      break;
    case "game":
      content = (
        <StaticDataGate>
          <MainPage />
        </StaticDataGate>
      );
      break;
    default:
      content = <LoginPage />;
      break;
  }

  return (
    <>
      {content}
      {IS_TEST_MODE && currentScreen !== "login" && <DevPanel />}
    </>
  );
};

export default ScreenRouter;
