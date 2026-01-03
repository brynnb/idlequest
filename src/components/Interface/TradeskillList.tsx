import React from "react";
import styled from "styled-components";
import SkillTile from "./SkillTile";
import { Skill, getSkillName } from "@entities/Skill";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

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

// Define which skills are tradeskills
const TRADESKILL_IDS: Skill[] = [
    Skill.Fishing,
    Skill.MakePoison,
    Skill.Tinkering,
    Skill.Research,
    Skill.Alchemy,
    Skill.Baking,
    Skill.Tailoring,
    Skill.Blacksmithing,
    Skill.Fletching,
    Skill.Brewing,
    Skill.JewelryMaking,
    Skill.Pottery,
];

const TradeskillList: React.FC = () => {
    const { characterProfile } = usePlayerCharacterStore();
    const skills = characterProfile?.skills || [];

    // Build an array of tradeskill entries with name and value
    const skillEntries: { id: number; name: string; value: number }[] = [];

    for (const skillId of TRADESKILL_IDS) {
        const name = getSkillName(skillId);
        const value = skills[skillId] ?? 0;

        if (name && name !== "Unknown") {
            skillEntries.push({ id: skillId, name, value });
        }
    }

    // Sort alphabetically by name
    skillEntries.sort((a, b) => a.name.localeCompare(b.name));

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
