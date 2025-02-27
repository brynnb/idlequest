import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { calculateTotalWeight } from "@utils/inventoryUtils";
import { calculateExperienceProgress } from "@utils/experienceUtils";
import StatBar from "@components/Interface/StatBar";

const StatInfoBarWrapper = styled.div.attrs({
  className: "stat-info-bar-wrapper",
})`
  position: absolute;
  left: 0;
  top: 0;
  width: 268px;
  height: 1080px;
  background-image: url("/images/ui/statbarbackground.png");
  background-size: cover;
  background-repeat: no-repeat;
`;

const StatsWrapper = styled.div.attrs({ className: "stats-wrapper" })`
  position: absolute;
  top: 139px;
  left: 55px;
  font-size: 20px;
  line-height: 10px;
  color: white;
`;

const Name = styled.div.attrs({ className: "name" })`
  position: absolute;
  top: 78px;
  left: 30px;
  font-size: 22px;
  line-height: 10px;
  color: white;
`;

const TopLevelStats = styled.div.attrs({ className: "top-level-stats" })``;

const LevelClassDeity = styled.div.attrs({ className: "level-class-deity" })`
  /* Add styles for level-class-deity */
`;

const Level = styled.div.attrs({ className: "level" })`
  left: 100px;
  top: 0px;
  position: absolute;
`;

const ClassAndDeity = styled.div.attrs({ className: "class-and-deity" })`
  position: absolute;
  left: 0px;
  top: 35px;
  width: 240px;
`;

const HpAcAtk = styled.div.attrs({ className: "hp-ac-atk" })`
  position: absolute;
  top: 102px;
  left: 60px;
  height: 200px;
  width: 200px;
  line-height: 7px;
`;

const ExperienceBarContainer = styled.div.attrs({
  className: "experience-bar-container",
})`
  position: absolute;
  top: 200px;
  left: 0px;
  width: 200px;
`;

const MiddleLevelAttributes = styled.div.attrs({
  className: "middle-level-attributes",
})`
  position: absolute;
  top: 365px;
  left: 104px;
  line-height: 6px;
`;

const MiddleBottomLevelResists = styled.div.attrs({
  className: "middle-bottom-level-resists",
})`
  position: absolute;
  top: 627px;
  left: 123px;
  line-height: 6px;
`;

const BottomLevelWeight = styled.div.attrs({
  className: "bottom-level-weight",
})`
  position: absolute;
  top: 850px;
  left: 40px;
  line-height: 6px;
  width: 200px;
`;

const StatInfoBar: React.FC = () => {
  const { attributes, totalAttributes, stats, ...rest } =
    usePlayerCharacterStore((state) => ({
      attributes: state.characterProfile.attributes,
      totalAttributes: state.characterProfile.totalAttributes,
      stats: state.characterProfile.stats,
      name: state.characterProfile.name,
      level: state.characterProfile.level,
      race: state.characterProfile.race,
      class: state.characterProfile.class,
      deity: state.characterProfile.deity,
      curHp: state.characterProfile.curHp,
      maxHp: state.characterProfile.maxHp,
      weightAllowance: state.characterProfile.weightAllowance,
      inventory: state.characterProfile.inventory,
      exp: state.characterProfile.exp,
    }));

  if (!attributes || !stats) {
    return <div>Loading character information...</div>;
  }

  const currentExp = rest.exp || 0;
  const { xpPercent, xpPercentSubbar } =
    calculateExperienceProgress(currentExp);

  return (
    <>
      <StatInfoBarWrapper />
      <Name>
        <p>{rest.name}</p>
      </Name>
      <StatsWrapper>
        <TopLevelStats>
          <LevelClassDeity>
            <Level>
              <p>{rest.level}</p>
            </Level>
            <ClassAndDeity>
              <p>
                {rest.race?.name} {rest.class?.name}
              </p>
              <p>{rest.deity?.name}</p>
            </ClassAndDeity>
          </LevelClassDeity>
          <HpAcAtk>
            <p>
              {rest.curHp} / {rest.maxHp}
            </p>
            <p>{stats?.ac ?? 0}</p>
            <p>{stats?.atk ?? 0}</p>
          </HpAcAtk>
        </TopLevelStats>
        <ExperienceBarContainer>
          <StatBar
            type="xp"
            percent={xpPercent}
            top={0}
            subbarPercent={xpPercentSubbar}
            subbarOffset={10}
          />
        </ExperienceBarContainer>
        <MiddleLevelAttributes>
          <p>{totalAttributes?.str ?? attributes?.str}</p>
          <p>{totalAttributes?.sta ?? attributes?.sta}</p>
          <p>{totalAttributes?.agi ?? attributes?.agi}</p>
          <p>{totalAttributes?.dex ?? attributes?.dex}</p>
          <p>{totalAttributes?.wis ?? attributes?.wis}</p>
          <p>{totalAttributes?.int ?? attributes?.int}</p>
          <p>{totalAttributes?.cha ?? attributes?.cha}</p>
        </MiddleLevelAttributes>
        <MiddleBottomLevelResists>
          <p>{stats?.pr ?? 0}</p>
          <p>{stats?.mr ?? 0}</p>
          <p>{stats?.dr ?? 0}</p>
          <p>{stats?.fr ?? 0}</p>
          <p>{stats?.cr ?? 0}</p>
        </MiddleBottomLevelResists>
        <BottomLevelWeight>
          <p>
            {calculateTotalWeight({ inventory: rest.inventory })} /{" "}
            {rest.weightAllowance}
          </p>
        </BottomLevelWeight>
      </StatsWrapper>
    </>
  );
};

export default StatInfoBar;
