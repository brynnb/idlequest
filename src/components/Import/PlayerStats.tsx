import React from 'react';

const PlayerStats = () => {
  const playerData = {
    // You'll need to populate this with your player data
    name: 'Player Name',
    healthPercent: 0.75,
    manaPercent: 0.5,
    xpPercent: 0.25,
    xpPercentSubbar: 0.1
  };

  return (
    <div className="player_stats">
      <div className="user-name name-text">{playerData.name}</div>
      <div className="health-bar">
        <img src="/images/healthbar_empty.png" className="empty-health" alt="Empty health bar" />
        <div className="full-health-container" style={{width: `calc((${playerData.healthPercent} * 74px) + 13px)`}}>
          <img src="/images/healthbar_full.png" className="full-health-image" alt="Full health bar" />
        </div>
      </div>
      <div className="mana-bar">
        <img src="/images/manabar_empty.png" className="empty-mana" alt="Empty mana bar" />
        <div className="full-mana-container" style={{width: `calc((${playerData.manaPercent} * 74px) + 13px)`}}>
          <img src="/images/manabar_full.png" className="full-mana-image" alt="Full mana bar" />
        </div>
      </div>
      <div className="xp-bar">
        <img src="/images/xpbar_empty.png" className="empty-xp" alt="Empty XP bar" />
        <div className="full-xp-container" style={{width: `calc((${playerData.xpPercent} * 74px) + 13px)`}}>
          <img src="/images/xpbar_full.png" className="full-xp-image" alt="Full XP bar" />
        </div>
      </div>
      <div className="xp-bar-sub">
        <div className="empty-xp-sub">
          <div className="full-xp-container-sub" style={{width: `calc((${playerData.xpPercentSubbar} * 74px) + 13px)`}}>
            <img src="/images/xpbar_subbar_full.png" className="full-xp-image-sub" alt="Full XP subbar" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;