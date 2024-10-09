import React from "react";
import styled from "styled-components";

const TargetAndActionsContainer = styled.div`
  .target-health-bar {
    position: relative;
    background-image: url("/images/targetbar.png");
    background-size: contain;
    background-repeat: no-repeat;
    width: 193px;
    height: 33px;
  }

  .target-full-health-container {
    overflow: hidden;
    position: absolute;
    top: 11px;
    left: 15px;
  }

  .target-full-health-image {
    height: 15px;
  }

  .target_name {
    color: #e4e1e1;
    top: 11px;
    left: 15px;
    position: absolute;
    font-size: 1.8vw;
    padding-left: 5px;
    padding-top: 2px;
    padding-right: 5px;
  }
`;

const TargetAndActions = () => {
  const targetData = {
    name: "Target Name",
    percentDone: 0.5,
  };

  return (
    <TargetAndActionsContainer className="target_and_actions">
      <div className="target-health-bar">
        <div
          className="target-full-health-container"
          style={{ width: `calc(${targetData.percentDone} * 126px)` }}
        >
          <img
            src="/images/target_healthbar_full.png"
            className="target-full-health-image"
            alt="Target health bar"
          />
        </div>
        <div className="target_name">{targetData.name}</div>
      </div>
    </TargetAndActionsContainer>
  );
};

export default TargetAndActions;
