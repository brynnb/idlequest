import React from "react";
import styled from "styled-components";

const TargetContainer = styled.div`
  position: relative;
`;

const TargetHealthBar = styled.div`
  position: absolute;
  width: 193px;
  top: 518px;
  left: 9px;
`;

const TargetFullHealthContainer = styled.div<{ $percentDone: number }>`
  overflow: hidden;
  position: absolute;
  top: 15px;
  left: 15px;
  width: ${(props) => `calc(${props.$percentDone} * 228px)`};
`;

const TargetFullHealthImage = styled.img`
  height: 28px;
`;

const TargetName = styled.div`
  color: #e4e1e1;
  top: 11px;
  left: 15px;
  position: absolute;
  font-size: 15pt;
  padding: 2px 5px 0 5px;
`;

const TargetBar: React.FC = () => {
  const targetData = {
    name: "Target Name",
    percentDone: 0.57,
  };

  return (
    <TargetContainer className="target_and_actions">
      <TargetHealthBar>
        <TargetFullHealthContainer $percentDone={targetData.percentDone}>
          <TargetFullHealthImage
            src="/images/target_healthbar_full.png"
            alt="Target health bar"
          />
        </TargetFullHealthContainer>
        <TargetName>{targetData.name}</TargetName>
      </TargetHealthBar>
    </TargetContainer>
  );
};

export default TargetBar;
