import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useStaticDataStore from "@stores/StaticDataStore";
import { WorldSocket } from "@/net";
import LoadingScreen from "./LoadingScreen";

interface StaticDataGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const StaticDataGate = ({ children, fallback }: StaticDataGateProps) => {
  const navigate = useNavigate();
  const { isLoaded, isLoading, loadStaticData } = useStaticDataStore();

  useEffect(() => {
    // If not connected, redirect to login
    if (!WorldSocket.isConnected) {
      navigate("/");
      return;
    }

    if (!isLoaded && !isLoading) {
      loadStaticData();
    }
  }, [isLoaded, isLoading, loadStaticData, navigate]);

  // If not connected, show loading while redirecting
  if (!WorldSocket.isConnected) {
    return <LoadingScreen message="Connecting..." isIndeterminate />;
  }

  if (!isLoaded) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <LoadingScreen message="Loading Game Data..." isIndeterminate />
    );
  }

  return <>{children}</>;
};

export default StaticDataGate;
