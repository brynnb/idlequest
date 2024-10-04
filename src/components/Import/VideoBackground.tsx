const VideoBackground = () => {
    return (
      <div className="view">
        <iframe
          id="youtube-background-player"
          width="560"
          height="315"
          src="" // You'll need to set this dynamically
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    );
  };
  
  export default VideoBackground;