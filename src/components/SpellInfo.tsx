import React from "react";
import { getSpellLevels } from "@hooks/useSpellInfo";
import styled from "styled-components";

const SpellInfoContainer = styled.div`
  margin-top: 15px;
`;

interface SpellInfoProps {
  spellInfo: {
    spell: any;
    description: string | null;
  };
}

const SpellInfo: React.FC<SpellInfoProps> = ({ spellInfo }) => {
  return (
    <SpellInfoContainer>
      <p>{getSpellLevels(spellInfo.spell)}</p>
      {spellInfo.description && <p>{spellInfo.description}</p>}
    </SpellInfoContainer>
  );
};

export default SpellInfo;
