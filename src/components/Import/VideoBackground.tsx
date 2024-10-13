import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getVideoEmbedOption } from "@utils/uiUtils";

const ViewContainer = styled.div`
  overflow: hidden;
  z-index: -1;
  position: absolute;
  top: 0;
`;

const VideoBackground: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState("");

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
