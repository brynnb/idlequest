import React from "react";
import usePlayerCharacterStore from "/src/stores/PlayerCharacterStore";
import styled from "styled-components";
import StatBar from "./StatBar";

const PlayerStatsContainer = styled.div.attrs({
  className: "player-stats-container",
})`
  position: absolute;
  top: 20px;
`;

const UserName = styled.div.attrs({ className: "user-name" })`
  position: absolute;
  left: 29px;
  top: 20px;
  font-size: 10pt;
  width: 98px;
  height: 32px;
  overflow: hidden;
  color: #d1d2d3;
`;

const BarsContainer = styled.div.attrs({ className: "bars-container" })`
  position: relative;
  top: 49px;
  left: 11px;
`;

const PlayerStats: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  // todo: implement these calculations based on game logic
  const healthPercent = 0.75; // Example value
  const manaPercent = 0.5; // Example value
  const xpPercent = 0.25; // Example value
  const xpPercentSubbar = 0.65; // Example value

  return (
    <PlayerStatsContainer>
      <UserName>{characterProfile.name}</UserName>
      <BarsContainer>
        <StatBar type="health" percent={healthPercent} top={0} />
        <StatBar type="mana" percent={manaPercent} top={20} />
        <StatBar type="xp" percent={xpPercent} top={40} />
      </BarsContainer>
    </PlayerStatsContainer>
  );
};

export default PlayerStats;
