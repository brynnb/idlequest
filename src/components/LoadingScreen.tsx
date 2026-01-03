import { useEffect, useState } from "react";
import styled from "styled-components";
import { LoadingJokeUtil } from "@utils/getRandomLoadingJoke";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background-image: url("/images/ui/login/loading-velious.jpg");
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
`;

const LoadingContainer = styled.div`
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
`;

const LoadingBarContainer = styled.div`
  width: 600px;
  height: 30px;
  background: #000000; /* Black background when not filled */
  border: 2px solid #ffff00; /* Yellow border */
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  position: relative; /* Needed for text overlay */
`;

const LoadingText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  font-family: sans-serif;
  font-size: 16px;
  font-weight: bold;
  color: #ffff00; /* Yellow text */
  text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000,
    -1px 1px 2px #000;
  letter-spacing: 1px;
  z-index: 2;
  white-space: nowrap;
`;

const LoadingBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background: #342fc0; /* Requested blue fill */
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(52, 47, 192, 0.5);
  z-index: 1;
`;

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  isIndeterminate?: boolean;
}

const LoadingScreen = ({
  message: _message = "Loading...",
  progress = 0,
  isIndeterminate = false,
}: LoadingScreenProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [loadingJoke, setLoadingJoke] = useState(() =>
    LoadingJokeUtil.getRandomLoadingJoke()
  );
  const [dots, setDots] = useState("");

  // Rotate through random jokes every 3 seconds
  useEffect(() => {
    const jokeInterval = setInterval(() => {
      setLoadingJoke(LoadingJokeUtil.getRandomLoadingJoke());
    }, 3000);

    return () => clearInterval(jokeInterval);
  }, []);

  // Animate the ellipsis
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, []);

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
        <LoadingBarContainer>
          <LoadingBarFill $progress={animatedProgress} />
          <LoadingText>
            {loadingJoke}
            {dots}
          </LoadingText>
        </LoadingBarContainer>
      </LoadingContainer>
    </Wrapper>
  );
};

export default LoadingScreen;
