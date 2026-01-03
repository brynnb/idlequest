import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import styled from "styled-components";
import StatBar from "./StatBar";
import { calculateExperienceProgress } from "@utils/experienceUtils";

const PlayerStatsContainer = styled.div.attrs({
  className: "player-stats-container",
})`
  position: absolute;
  top: 20px;
`;

const UserName = styled.div.attrs({ className: "user-name" })`
  position: absolute;
  left: 48px;
  top: 14px;
  font-size: 18pt;
  width: 180px;
  max-height: 70px;
  overflow: hidden;
  color: #d1d2d3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  line-height: 1.3;
`;

const BarsContainer = styled.div.attrs({ className: "bars-container" })`
  position: absolute;
  top: 80px;
  left: 11px;
`;

const PlayerStats: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  const healthPercent =
    (characterProfile.curHp || 0) / (characterProfile.maxHp || 1);
  const manaPercent =
    (characterProfile.mana || 0) / (characterProfile.maxMana || 1);

  const currentExp = characterProfile.exp || 0;
  const { xpPercent, xpPercentSubbar } =
    calculateExperienceProgress(currentExp);

  return (
    <PlayerStatsContainer>
      <UserName>{characterProfile?.name}</UserName>
      <BarsContainer>
        <StatBar type="health" percent={healthPercent} top={0} />
        <StatBar type="mana" percent={manaPercent} top={20} />
        <StatBar
          type="xp"
          percent={xpPercent}
          top={40}
          subbarPercent={xpPercentSubbar}
        />
      </BarsContainer>
    </PlayerStatsContainer>
  );
};

export default PlayerStats;
