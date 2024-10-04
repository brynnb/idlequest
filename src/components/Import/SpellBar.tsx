import React from 'react';

const SpellBar = () => {
  const spellGems = {
    // You'll need to populate this with your spell data
  };

  return (
    <div className="spellbar">
      {Object.entries(spellGems).map(([key, gem]) => (
        <div
          key={key}
          className="spell_gem"
          id={`spell_gem_${key}`}
          style={{
            background: `url('/images/${gem.spritesheet}') ${gem.x}px ${gem.y}px no-repeat`,
            backgroundSize: '263px'
          }}
        />
      ))}
    </div>
  );
};

export default SpellBar;