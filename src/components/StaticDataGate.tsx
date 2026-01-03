import { useEffect, ReactNode } from "react";
import useStaticDataStore from "@stores/StaticDataStore";
import useGameScreenStore from "@stores/GameScreenStore";
import { WorldSocket } from "@/net";
import LoadingScreen from "./LoadingScreen";
import { useMinimumLoadingTime } from "@hooks/useMinimumLoadingTime";

interface StaticDataGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const StaticDataGate = ({ children, fallback }: StaticDataGateProps) => {
  const setScreen = useGameScreenStore((state) => state.setScreen);
  const { isLoaded, isLoading, loadStaticData } = useStaticDataStore();

  useEffect(() => {
    // If not connected, redirect to login
    if (!WorldSocket.isConnected) {
      setScreen("login");
      return;
    }

    if (!isLoaded && !isLoading) {
      loadStaticData();
    }
  }, [isLoaded, isLoading, loadStaticData, setScreen]);

  const showLoading = useMinimumLoadingTime(!WorldSocket.isConnected || !isLoaded);

  if (showLoading) {
    if (!WorldSocket.isConnected) {
      return <LoadingScreen message="Connecting..." isIndeterminate />;
    }
    return fallback ? (
      <>{fallback}</>
    ) : (
      <LoadingScreen message="Loading Game Data..." isIndeterminate />
    );
  }

  return <>{children}</>;
};

export default StaticDataGate;
