import React from "react";
import styled from "styled-components";
import useGameStatusStore from "@stores/GameStatusStore";

const TargetContainer = styled.div`
  position: relative;
`;

const TargetHealthBar = styled.div`
  position: absolute;
  width: 193px;
  top: 518px;
  left: 9px;
`;

const TargetFullHealthContainer = styled.div.attrs<{ $percentDone: number }>(
  ({ $percentDone }) => ({
    style: {
      width: `calc(${$percentDone} * 228px)`,
    },
  })
)`
  overflow: hidden;
  position: absolute;
  top: 15px;
  left: 15px;
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
  const { targetNPC, currentNPCHealth } = useGameStatusStore((state) => ({
    targetNPC: state.targetNPC,
    currentNPCHealth: state.currentNPCHealth,
  }));

  if (!targetNPC || currentNPCHealth === null) {
    return null;
  }

  const percentDone = currentNPCHealth / Number(targetNPC.hp);

  return (
    <TargetContainer className="target_and_actions">
      <TargetHealthBar>
        <TargetFullHealthContainer $percentDone={percentDone}>
          <TargetFullHealthImage
            src="/images/target_healthbar_full.png"
            alt="Target health bar"
          />
        </TargetFullHealthContainer>
        <TargetName>{targetNPC.name.replace(/_/g, " ")}</TargetName>
      </TargetHealthBar>
    </TargetContainer>
  );
};

export default TargetBar;
