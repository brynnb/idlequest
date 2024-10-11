import React from "react";
import styled from "styled-components";
import { getSpellGems, SpellGem } from "../../utils/uiUtils";

const SpellBarContainer = styled.div.attrs({
  className: "spell-bar-container",
})`
  width: 30px;
  left: 111px;
  position: absolute;
  padding-top: 2px;
`;

const SpellGemDiv = styled.div.attrs({
  className: "spell-gem",
})`
  margin-top: 19px;
  width: 38px;
  height: 29px;
  left: 11px;
`;

interface SpellGemProps {
  gem: SpellGem;
  index: number;
}

const SpellGemComponent: React.FC<SpellGemProps> = ({ gem, index }) => (
  <SpellGemDiv
    id={`spell_gem_${index + 1}`}
    style={{
      background: `url('/images/${gem.spritesheet}') ${gem.x}px ${gem.y}px no-repeat`,
      backgroundSize: "263px",
    }}
  />
);

const SpellBar: React.FC = () => {
  const spellGems = React.useMemo(() => getSpellGems(), []);

  return (
    <SpellBarContainer>
      {spellGems.map((gem, index) => (
        <SpellGemComponent key={index} gem={gem} index={index} />
      ))}
    </SpellBarContainer>
  );
};

export default SpellBar;
