import React from 'react';

const GroupContainer = () => {
  const partyMembers = [
    // You'll need to populate this with your party member data
    { username: 'Member1', healthPercent: 0.8 },
    { username: 'Member2', healthPercent: 0.6 },
  ];

  return (
    <div className="group-container">
      {partyMembers.map((member, index) => (
        <div key={index} className="group-member">
          <span className="group-member-name name-text">
            {member.username}
          </span>
          <div className="health-bar-member">
            <div className="full-health-container" style={{width: `${member.healthPercent * 100}%`}}>
              <img src="/images/healthbar_full.png" className="full-health-image" alt="Full health bar" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupContainer;