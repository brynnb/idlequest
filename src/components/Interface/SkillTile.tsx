import React from "react";
import styled from "styled-components";
import { getSkillRank } from "@utils/skillRankUtils";

const TileContainer = styled.div`
  width: 100%;
  aspect-ratio: 596 / 443;
  background-image: url("/images/abilitybg.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
  padding: 16px;
  box-sizing: border-box;
`;

const SkillName = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #d4d4d4;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
`;

const Divider = styled.hr`
  width: 80%;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  margin: 6px 0;
`;

const RankText = styled.div`
  font-size: 16px;
  color: #c0c0c0;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
`;

interface SkillTileProps {
    skillName: string;
    skillValue: number;
}

const SkillTile: React.FC<SkillTileProps> = ({ skillName, skillValue }) => {
    const rank = getSkillRank(skillValue);

    return (
        <TileContainer>
            <SkillName>{skillName}</SkillName>
            <Divider />
            <RankText>{rank}</RankText>
        </TileContainer>
    );
};

export default SkillTile;
