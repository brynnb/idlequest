import React from "react";
import styled from "styled-components";
import SkillTile from "./SkillTile";
import { getSkillName } from "@entities/Skill";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getTradeskillValue, TRADESKILL_IDS } from "@utils/tradeskillUtils";

const ListContainer = styled.div`
  position: absolute;
  left: 30px;
  top: 80px;
  bottom: 20px;
  right: 20px;
  height: 900px;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.5) transparent;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 4px;
  }
`;

const TradeskillList: React.FC = () => {
    const { characterProfile } = usePlayerCharacterStore();

    // Build an array of tradeskill entries with name and value
    const skillEntries = TRADESKILL_IDS
        .map((skillId) => ({
            id: skillId,
            name: getSkillName(skillId),
            value: getTradeskillValue(skillId, characterProfile),
        }))
        .filter((skill) => skill.name && skill.name !== "Unknown")
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <ListContainer>
            {skillEntries.map((skill) => (
                <SkillTile
                    key={skill.id}
                    skillName={skill.name}
                    skillValue={skill.value}
                />
            ))}
        </ListContainer>
    );
};

export default TradeskillList;
