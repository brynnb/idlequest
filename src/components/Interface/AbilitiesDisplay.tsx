import React from "react";
import styled from "styled-components";
import SkillList from "./SkillList";

const AbilitiesContainer = styled.div`
  width: 246px;
  height: 1080px;
  position: absolute;
  left: 0;
  top: 0;
`;

const ParentContainer = styled.div`
  width: 246px;
  height: 1080px;
  background-image: url("/images/ui/lootpanebackground.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  color: white;
  overflow-y: auto;
  padding-left: 24px;
`;

const PaneTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  top: 35px;
  left: 25px;
  position: absolute;
`;

const AbilitiesDisplay: React.FC = () => {
    return (
        <AbilitiesContainer>
            <ParentContainer>
                <PaneTitle>Skills</PaneTitle>
                <SkillList />
            </ParentContainer>
        </AbilitiesContainer>
    );
};

export default AbilitiesDisplay;
