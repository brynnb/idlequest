import React from "react";
import { getSpellLevels } from "@hooks/useSpellInfo";

interface SpellInfoProps {
  spellInfo: {
    spell: any;
    description: string | null;
  };
}

const SpellInfo: React.FC<SpellInfoProps> = ({ spellInfo }) => {
  return (
    <>
      <p>{getSpellLevels(spellInfo.spell)}</p>
      {spellInfo.description && <p>{spellInfo.description}</p>}
    </>
  );
};

export default SpellInfo;
