import { useEffect, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-image: url("/images/ui/login/loading-velious.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const LoadingContainer = styled.div`
  position: absolute;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
`;

const LoadingText = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  color: #d4af37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const LoadingBarContainer = styled.div`
  width: 400px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #8b7355;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const LoadingBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background: linear-gradient(to bottom, #d4af37 0%, #b8960c 50%, #d4af37 100%);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
`;

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  isIndeterminate?: boolean;
}

const LoadingScreen = ({
  message = "Loading...",
  progress = 0,
  isIndeterminate = false,
}: LoadingScreenProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isIndeterminate) {
      // Animate progress bar back and forth for indeterminate loading
      const interval = setInterval(() => {
        setAnimatedProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, isIndeterminate]);

  return (
    <Wrapper>
      <LoadingContainer>
        <LoadingText>{message}</LoadingText>
        <LoadingBarContainer>
          <LoadingBarFill $progress={animatedProgress} />
        </LoadingBarContainer>
      </LoadingContainer>
    </Wrapper>
  );
};

export default LoadingScreen;
