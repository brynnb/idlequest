import useGameScreenStore from "@stores/GameScreenStore";
import LoginPage from "@/pages/LoginPage";
import CharacterSelectPage from "@/pages/CharacterSelectPage";
import CharacterCreatorPage from "@/pages/CharacterCreatorPage";
import MainPage from "@/pages/MainPage";
import StaticDataGate from "./StaticDataGate";

const ScreenRouter = () => {
  const { currentScreen } = useGameScreenStore();

  switch (currentScreen) {
    case "login":
      return <LoginPage />;
    case "characterSelect":
      return (
        <StaticDataGate>
          <CharacterSelectPage />
        </StaticDataGate>
      );
    case "characterCreate":
      return (
        <StaticDataGate>
          <CharacterCreatorPage />
        </StaticDataGate>
      );
    case "game":
      return (
        <StaticDataGate>
          <MainPage />
        </StaticDataGate>
      );
    default:
      return <LoginPage />;
  }
};

export default ScreenRouter;
