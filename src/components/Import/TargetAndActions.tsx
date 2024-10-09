import React from 'react';
import styled from 'styled-components';

const TargetAndActionsContainer = styled.div`
  .target-health-bar {
    position: relative;
  }

  .target-full-health-container {
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
  }

  .target-full-health-image {
    height: 15px;
  }

  .target_name {
    color: #e4e1e1;
    top: -1px;
    position: absolute;
    left: 0px;
    font-size: 0.9vw;
    padding-left: 5px;
    padding-top: 2px;
    padding-right: 5px;
  }
`;

const TargetAndActions = () => {
  const targetData = {
    name: 'Target Name',
    percentDone: .5
  };

  return (
    <TargetAndActionsContainer className="target_and_actions">
      <div className="target-health-bar">
        <div className="target-full-health-container" style={{width: `calc(${targetData.percentDone} * 126px)`}}>
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