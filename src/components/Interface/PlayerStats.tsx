import React from "react";
import usePlayerCharacterStore from "/src/stores/PlayerCharacterStore";
import styled from "styled-components";

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
`;

interface BarProps {
  type: 'health' | 'mana' | 'xp';
  percent: number;
  top: number;
}

const Bar: React.FC<BarProps> = ({ type, percent, top }) => {
  const BarContainer = styled.div.attrs({ className: `${type}-bar` })`
    position: absolute;
    left: 26px;
    top: ${top}px;
    width: 99px;
  `;

  const EmptyBar = styled.img.attrs({ className: "empty-bar" })`
    width: 100%;
    position: relative;
    top: 0;
    left: 0;
  `;

  const FullBarContainer = styled.div.attrs({ className: "full-bar-container" })<{
    width: string;
  }>`
    width: ${(props) => props.width};
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
  `;

  const FullBarImage = styled.img.attrs({ className: "full-bar-image" })`
    width: 99px;
  `;

  return (
    <BarContainer>
      <EmptyBar
        src={`/images/${type}bar_empty.png`}
        className={`empty-${type}`}
        alt={`Empty ${type} bar`}
      />
      <FullBarContainer width={`calc((${percent} * 74px) + 13px)`}>
        <FullBarImage
          src={`/images/${type}bar_full.png`}
          className={`full-${type}-image`}
          alt={`Full ${type} bar`}
        />
      </FullBarContainer>
    </BarContainer>
  );
};

const XPBarSub: React.FC<{ percent: number }> = ({ percent }) => {
  const XPBarSubContainer = styled.div.attrs({ className: "xp-bar-sub" })`
    position: absolute;
    left: 26px;
    top: 24px;
    width: 99px;
  `;

  const FullXPContainerSub = styled.div.attrs({
    className: "full-xp-container-sub",
  })<{
    width: string;
  }>`
    width: ${(props) => props.width};
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
  `;

  const FullXPImageSub = styled.img.attrs({ className: "full-xp-image-sub" })`
    width: 99px;
  `;

  return (
    <XPBarSubContainer>
      <FullXPContainerSub width={`calc((${percent} * 74px) + 13px)`}>
        <FullXPImageSub
          src="/images/xpbar_subbar_full.png"
          alt="Full XP subbar"
        />
      </FullXPContainerSub>
    </XPBarSubContainer>
  );
};

const PlayerStats: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  // You'll need to implement these calculations based on your game logic
  const healthPercent = 0.75; // Example value
  const manaPercent = 0.56; // Example value
  const xpPercent = 0.25; // Example value
  const xpPercentSubbar = 0.1; // Example value

  return (
    <PlayerStatsContainer>
      <UserName>{characterProfile.name}</UserName>
      <BarsContainer>
        <Bar type="health" percent={healthPercent} top={0} />
        <Bar type="mana" percent={manaPercent} top={12} />
        <Bar type="xp" percent={xpPercent} top={24} />
        <XPBarSub percent={xpPercentSubbar} />
      </BarsContainer>
    </PlayerStatsContainer>
  );
};

export default PlayerStats;
