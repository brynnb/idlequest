import React, { useState, useEffect } from 'react';
import { getVideoEmbedOption } from '../../utils/uiUtils';

const VideoBackground: React.FC = () => {
    const [videoSrc, setVideoSrc] = useState('');

    useEffect(() => {
        setVideoSrc(getVideoEmbedOption());
    }, []);

    return (
      <div className="view">
        <iframe
          id="youtube-background-player"
          width="560"
          height="315"
          src={videoSrc}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
};

export default VideoBackground;