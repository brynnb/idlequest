import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import { calculateTotalWeight } from "@utils/inventoryUtils";
const StatInfoBarWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 268px;
  height: 1080px;
  background-image: url("/images/ui/statbarbackground.png");
  background-size: cover;
  background-repeat: no-repeat;
`;

const StatsWrapper = styled.div`
  position: absolute;
  top: 139px;
  left: 55px;
  font-size: 20px;
  line-height: 10px;
  color: white;
`;

const Name = styled.div`
  position: absolute;
  top: 78px;
  left: 30px;
  font-size: 22px;
  line-height: 10px;
  color: white;
`;

const TopLevelStats = styled.div``;

const LevelClassDeity = styled.div`
  /* Add styles for level-class-deity */
`;

const Level = styled.div`
  left: 100px;
  top: 0px;
  position: absolute;
`;

const ClassAndDeity = styled.div`
  position: absolute;
  left: 00px;
  top: 30px;
  width: 240px;
`;

const HpAcAtk = styled.div`
  position: absolute;
  top: 102px;
  left: 80px;
  height: 200px;
  width: 200px;
  line-height: 7px;
`;

const MiddleLevelAttributes = styled.div`
  position: absolute;
  top: 365px;
  left: 104px;
  line-height: 6px;
`;

const MiddleBottomLevelResists = styled.div`
  /* Add styles for middle-bottom-level-resists */
`;

const BottomLevelWeight = styled.div`
  position: absolute;
  top: 850px;
  left: 104px;
  line-height: 6px;
`;

const StatInfoBar: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const { toggleInventory } = useGameStatusStore();

  return (
    <>
      <StatInfoBarWrapper />
      <Name>
        <p>{characterProfile.name}</p>
      </Name>
      <StatsWrapper>
        <TopLevelStats>
          <LevelClassDeity>
            <Level>
              <p>{characterProfile.level}</p>
            </Level>
            <ClassAndDeity>
              <p>{characterProfile.class.name}</p>
              <p>{characterProfile.deity.name}</p>
            </ClassAndDeity>
          </LevelClassDeity>
          <HpAcAtk>
            <p>
              {characterProfile.curHp} / {characterProfile.maxHp}
            </p>
            <p>{characterProfile.stats?.ac}</p>
            <p>{characterProfile.stats?.atk}</p>
          </HpAcAtk>
        </TopLevelStats>
        <MiddleLevelAttributes>
          <p>{characterProfile.attributes?.str}</p>
          <p>{characterProfile.attributes?.sta}</p>
          <p>{characterProfile.attributes?.agi}</p>
          <p>{characterProfile.attributes?.dex}</p>
          <p>{characterProfile.attributes?.wis}</p>
          <p>{characterProfile.attributes?.int}</p>
          <p>{characterProfile.attributes?.cha}</p>
        </MiddleLevelAttributes>
        <MiddleBottomLevelResists>
          <p>{characterProfile.pr}</p>
          <p>{characterProfile.mr}</p>
          <p>{characterProfile.dr}</p>
          <p>{characterProfile.fr}</p>
          <p>{characterProfile.cr}</p>
        </MiddleBottomLevelResists>
        <BottomLevelWeight>
          <p>
            {calculateTotalWeight(characterProfile)} /{" "}
            {characterProfile.weightAllowance}
          </p>
        </BottomLevelWeight>
      </StatsWrapper>
    </>
  );
};

export default StatInfoBar;
