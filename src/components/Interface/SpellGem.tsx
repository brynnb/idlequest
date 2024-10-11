import React from "react";
import styled from "styled-components";
import { getSpellGems, SpellGem } from "/src/utils/uiUtils";

const SpellGemDiv = styled.div.attrs({
  className: 'spell-gem'
})`
  margin-top: 19px;
  width: 38px;
  height: 29px;
  left: 11px;
`;

const SpellGems: React.FC = () => {
  const spellGems: Record<string, SpellGem> = getSpellGems();

  return (
    <>
      {Object.entries(spellGems).map(([key, gem]) => (
        <SpellGemDiv
          key={key}
          id={`spell_gem_${key}`}
          style={{
            background: `url('/images/${gem.spritesheet}') ${gem.x}px ${gem.y}px no-repeat`,
            backgroundSize: "263px",
          }}
        />
      ))}
    </>
  );
};

export default SpellGems;
