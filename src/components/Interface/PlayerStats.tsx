import React from "react";
import usePlayerCharacterStore from "/src/stores/PlayerCharacterStore";
import styled from "styled-components";

const PlayerStatsContainer = styled.div.attrs({
  className: "player-stats-container",
})`
  position: relative;
  background-image: url("/images/player_stats_bg.png");
  background-size: contain;
  background-repeat: no-repeat;
  width: 193px;
  height: 100px;
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

const HealthBar = styled.div.attrs({ className: "health-bar" })`
  position: absolute;
  left: 26px;
  top: 0px;
  width: 99px;
`;

const ManaBar = styled.div.attrs({ className: "mana-bar" })`
  position: absolute;
  left: 26px;
  top: 12px;
  width: 99px;
`;

const XPBar = styled.div.attrs({ className: "xp-bar" })`
  position: absolute;
  left: 26px;
  top: 24px;
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

const XPBarSub = styled.div.attrs({ className: "xp-bar-sub" })`
  position: absolute;
  left: 26px;
  top: 78px;
  width: 99px;
`;

const EmptyXPSub = styled.div.attrs({ className: "empty-xp-sub" })`
  width: 100%;
  position: relative;
  top: 0;
  left: 0;
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

const BarsContainer = styled.div.attrs({ className: "bars-container" })`
  position: relative;
  top: 49px;
`;

const PlayerStats: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  // You'll need to implement these calculations based on your game logic
  const healthPercent = 0.75; // Example value
  const manaPercent = 0.5; // Example value
  const xpPercent = 0.25; // Example value
  const xpPercentSubbar = 0.1; // Example value

  return (
    <PlayerStatsContainer>
      <UserName>{characterProfile.name}</UserName>
      <BarsContainer>
        <HealthBar>
          <EmptyBar
            src="/images/healthbar_empty.png"
            className="empty-health"
            alt="Empty health bar"
          />
          <FullBarContainer width={`calc((${healthPercent} * 74px) + 13px)`}>
            <FullBarImage
              src="/images/healthbar_full.png"
              className="full-health-image"
              alt="Full health bar"
            />
          </FullBarContainer>
        </HealthBar>
        <ManaBar>
          <EmptyBar
            src="/images/manabar_empty.png"
            className="empty-mana"
            alt="Empty mana bar"
          />
          <FullBarContainer width={`calc((${manaPercent} * 74px) + 13px)`}>
            <FullBarImage
              src="/images/manabar_full.png"
              className="full-mana-image"
              alt="Full mana bar"
            />
          </FullBarContainer>
        </ManaBar>
        <XPBar>
          <EmptyBar
            src="/images/xpbar_empty.png"
            className="empty-xp"
            alt="Empty XP bar"
          />
          <FullBarContainer width={`calc((${xpPercent} * 74px) + 13px)`}>
            <FullBarImage
              src="/images/xpbar_full.png"
              className="full-xp-image"
              alt="Full XP bar"
            />
          </FullBarContainer>
        </XPBar>
        <XPBarSub>
          <EmptyXPSub>
            <FullXPContainerSub
              width={`calc((${xpPercentSubbar} * 74px) + 13px)`}
            >
              <FullXPImageSub
                src="/images/xpbar_subbar_full.png"
                alt="Full XP subbar"
              />
            </FullXPContainerSub>
          </EmptyXPSub>
        </XPBarSub>
      </BarsContainer>
    </PlayerStatsContainer>
  );
};

export default PlayerStats;
