import { Box, Button } from "@mui/material";
import React, { useRef, useState } from "react";
import ReactPlayer from "react-player";
import {socket} from "../App";

interface VideoPlayerProps {
  url: string;
  hideControls?: boolean;
  sessionId: string | undefined;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, hideControls, sessionId }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pause, setPause] = useState(false);
  const [prevNum, setPrevNum] = useState(0);
  const player = useRef<ReactPlayer>(null);

  socket.on("pause", () => {
    setPause(true);
  })

  socket.on("play", () => {
    setPause(false);
  })

  socket.on("syncProgress", (progress) => {
    player.current?.seekTo(progress.playedSeconds, 'seconds');
  })

  // socket.on("progress", (progress) => {
  //   player.current?.seekTo(progress.playedSeconds, 'seconds');
  // })

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handleSeek = (seconds: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?

    console.log(
      "This never prints because seek decetion doesn't work: ",
      seconds
    );
  };

  const handlePlay = () => {
    console.log(
      "User played video at time: ",
      player.current?.getCurrentTime()
    );
    socket.emit("onPlay", sessionId);
  };

  const handlePause = () => {
    console.log(
      "User paused video at time: ",
      player.current?.getCurrentTime()
    );
    socket.emit("onPause", sessionId);
  };

  const handleBuffer = () => {
    console.log("Video buffered");
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    socket.emit("onProgress", {sessionId, state})

    const seekThreshold = 2;

    // Check if the difference between current and previous 'playedSeconds' is greater than the threshold
    if (Math.abs(state.playedSeconds - prevNum) > seekThreshold) {
      // if (prevPlayedSeconds !== 0) {
        // A seek action is detected
        const seekTime = state && state.playedSeconds;
        socket.emit("seekVideo", { sessionId, seekTime });
      // }
    }
    setPrevNum(state.playedSeconds);

    console.log("Video progress: ", state);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box
        width="100%"
        height="100%"
        display={hasJoined ? "flex" : "none"}
        flexDirection="column"
      >
        <ReactPlayer
          ref={player}
          url={url}
          playing={hasJoined && !pause}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => setHasJoined(true)}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
