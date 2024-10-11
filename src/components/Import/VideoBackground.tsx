import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getVideoEmbedOption } from "../../utils/uiUtils";

const ViewContainer = styled.div`
  overflow: hidden;
  z-index: -1;
  position: absolute;
  top: 0;
`;

const VideoBackground: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    setVideoSrc(getVideoEmbedOption());
  }, []);

  return (
    <ViewContainer className="view">
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
