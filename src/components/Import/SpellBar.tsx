import React from "react";
import styled from "styled-components";
import { getSpellGems, SpellGem } from "@utils/uiUtils";

const SCALE_FACTOR = 1.8; //using scale factor to properly size the gems and make adjustment easier as UI tweaks are made

const SpellBarContainer = styled.div.attrs({
  className: "spell-bar-container",
})`
  width: 70px;
  right: 0px;
  position: absolute;
  padding-top: 2px;
`;

const SpellGemDiv = styled.div.attrs({
  className: "spell-gem",
})<{ $scaleFactor: number }>`
  margin-top: ${18.5 * SCALE_FACTOR}px;
  width: ${38 * SCALE_FACTOR}px;
  height: ${28.9 * SCALE_FACTOR}px;
`;

const SpellBar: React.FC = () => {
  const spellGems = React.useMemo<SpellGem[]>(() => getSpellGems(), []);

  return (
    <SpellBarContainer>
      {spellGems.map((gem: SpellGem, index: number) => (
        <SpellGemDiv
          key={index}
          id={`spell_gem_${index + 1}`}
          $scaleFactor={SCALE_FACTOR}
          style={{
            background: `url('/images/${gem.spritesheet}') ${
              gem.x * SCALE_FACTOR
            }px ${gem.y * SCALE_FACTOR}px no-repeat`,
            backgroundSize: `${263.3 * SCALE_FACTOR}px`,
          }}
        />
      ))}
    </SpellBarContainer>
  );
};

export default SpellBar;
