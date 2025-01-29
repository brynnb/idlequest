import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { getVideoEmbedOption } from "@utils/uiUtils";
import { useLocation } from "react-router-dom";
import useGameStatusStore from "@stores/GameStatusStore";

interface ViewContainerProps {
  $isCharacterCreation: boolean;
}

const ViewContainer = styled.div<ViewContainerProps>`
  overflow: hidden;
  position: absolute;
  top: 0;
  z-index: ${(props) => (props.$isCharacterCreation ? -2 : -1)};
`;

const VideoBackground: React.FC = () => {
  const location = useLocation();
  const isCharacterCreation = location.pathname === "/create";
  const isMuted = useGameStatusStore((state) => state.isMuted);
  const currentVideoIndex = useGameStatusStore(
    (state) => state.currentVideoIndex
  );
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const videos =
      getVideoEmbedOption().split("playlist=")[1]?.split(",") || [];
    const index = currentVideoIndex % videos.length;
    setVideoId(videos[index] || "");
  }, [currentVideoIndex]);

  // Add click handler to document to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      document.removeEventListener("click", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  // Construct the full embed URL with all necessary parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&playsinline=1&origin=${encodeURIComponent(
    window.location.origin
  )}&modestbranding=1&version=3&iv_load_policy=3`;

  // Handle mute state changes and initial unmute
  useEffect(() => {
    if (!hasInteracted) return;

    const timeoutId = setTimeout(() => {
      if (playerRef.current?.contentWindow) {
        const message = {
          event: "command",
          func: isMuted ? "mute" : "unMute",
          args: [],
        };
        playerRef.current.contentWindow.postMessage(
          JSON.stringify(message),
          "*"
        );
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isMuted, hasInteracted, videoId]);

  if (!videoId) return null;

  return (
    <ViewContainer className="view" $isCharacterCreation={isCharacterCreation}>
      <iframe
        ref={playerRef}
        id="youtube-background-player"
        width="1400"
        height="750"
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </ViewContainer>
  );
};

export default VideoBackground;
