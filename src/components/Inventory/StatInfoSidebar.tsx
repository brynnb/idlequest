import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";

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
`;

const HpAcAtk = styled.div`
  position: absolute;
  top:102px;
  left:80px;
  height:200px;
  width:200px;
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
  /* Add styles for bottom-level-weight */
`;

const StatInfoBar: React.FC = () => {
  const { deleteItemOnCursor, hoveredItem, characterProfile } =
    usePlayerCharacterStore();
  const { toggleInventory } = useGameStatusStore();

  return (
    <>
      <StatInfoBarWrapper />
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
            <p>{characterProfile.ac}</p>
            <p>{characterProfile.atk}</p>
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
          {/* <p>Weight: {characterProfile.weight} / {characterProfile.max_weight}</p> */}
        </BottomLevelWeight>
      </StatsWrapper>
    </>
  );
};

export default StatInfoBar;
