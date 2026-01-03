import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { WorldSocket } from "@/net";

const MeterContainer = styled.div`
  position: absolute;
  bottom: 362px; /* Just above the chatbox */
  right: 280px; /* To the left of the right sidebar (272px wide) */
  display: flex;
  gap: 12px;
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;
  color: #00ff00; /* Classic green text */
  text-shadow: 1px 1px 1px #000;
  pointer-events: none; /* Don't block clicks */
  z-index: 10;
  letter-spacing: 0.5px;
`;

const NetworkMeter: React.FC = () => {
    const [fps, setFps] = useState<number>(48);
    const [latency, setLatency] = useState<number>(WorldSocket.latency || 0);

    useEffect(() => {
        // Update FPS every 5 seconds (Simulated for EQ aesthetic)
        const fpsInterval = setInterval(() => {
            setFps(Math.floor(Math.random() * (60 - 40 + 1)) + 40);
        }, 5000);

        // Subscribe to real latency updates from WorldSocket
        WorldSocket.onPing = (realLatency) => {
            setLatency(realLatency);
        };

        return () => {
            clearInterval(fpsInterval);
            WorldSocket.onPing = null;
        };
    }, []);

    return (
        <MeterContainer>
            <span>{fps},</span>
            <span>0.0%,</span>
            <span>0.0%,</span>
            <span>{latency}</span>
        </MeterContainer>
    );
};

export default NetworkMeter;

