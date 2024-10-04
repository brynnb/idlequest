import React from 'react';

const TargetAndActions = () => {
  const targetData = {
    // You'll need to populate this with your target data
    name: 'Target Name',
    percentDone: 0.6
  };

  return (
    <div className="target_and_actions">
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
    </div>
  );
};

export default TargetAndActions;