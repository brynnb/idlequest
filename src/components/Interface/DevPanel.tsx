import styled from "styled-components";
import { WorldSocket } from "@/net";
import { OpCodes } from "@/net/opcodes";
import { CommandMessage } from "@/net/capnp/common";

const DevPanelContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #555;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  font-family: "Inter", sans-serif;
  min-width: 150px;
`;

const DevTitle = styled.div`
  color: #ffcc00;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
  margin-bottom: 5px;
`;

const DevButton = styled.button`
  background: #333;
  color: #eee;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: #444;
    border-color: #777;
    color: #fff;
  }

  &:active {
    background: #222;
    transform: translateY(1px);
  }
`;

const DevPanel = () => {
    const sendCommand = async (command: string, args: string[] = []) => {
        try {
            await WorldSocket.sendMessage(OpCodes.GMCommand, CommandMessage, {
                command,
                args,
            });
            console.log(`[DevPanel] Sent dev command: ${command}`, args);
        } catch (err) {
            console.error(`[DevPanel] Failed to send dev command ${command}:`, err);
        }
    };

    return (
        <DevPanelContainer id="dev-panel">
            <DevTitle>Dev Tools</DevTitle>
            <DevButton onClick={() => sendCommand("heal")}>
                Heal Player (Full HP)
            </DevButton>
            <DevButton onClick={() => sendCommand("exp", ["1000"])}>
                Gain 1000 XP
            </DevButton>
            <DevButton onClick={() => sendCommand("win")}>
                Set NPC HP to 1
            </DevButton>
            <DevButton onClick={() => sendCommand("suicide")}>
                Set Player HP to 1
            </DevButton>
        </DevPanelContainer>
    );
};

export default DevPanel;
