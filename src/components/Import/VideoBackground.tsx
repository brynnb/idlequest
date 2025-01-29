import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getVideoEmbedOption } from "@utils/uiUtils";
import { useLocation } from "react-router-dom";

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
  const [videoSrc, setVideoSrc] = useState("");
  const location = useLocation();
  const isCharacterCreation = location.pathname === "/create";

  useEffect(() => {
    const baseUrl = getVideoEmbedOption();
    const params = new URLSearchParams({
      controls: "0",
      showinfo: "0",
      rel: "0",
      autoplay: "1",
      mute: "1",
      loop: "1",
    });
    setVideoSrc(`${baseUrl}&${params.toString()}`);
  }, []);

  return (
    <ViewContainer className="view" $isCharacterCreation={isCharacterCreation}>
      <iframe
        id="youtube-background-player"
        width="1400"
        height="750"
        src={videoSrc}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </ViewContainer>
  );
};

export default VideoBackground;
