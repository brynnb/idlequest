import React from "react";
import useCharacterProfileStore from '../stores/PlayerCharacterStore';

const baseAttributes = ['str', 'sta', 'dex', 'agi', 'int', 'wis', 'cha'] as const;

const AttributeAllocator: React.FC = () => {
  const { characterProfile, incrementAttribute, decrementAttribute } = useCharacterProfileStore();

  return (
    <div>
      <h2>Attribute Allocator</h2>
      {baseAttributes.map((attr) => {
        const baseAttr = `base_${attr}` as keyof CharacterCreationAttributes;
        return (
          <div key={attr}>
            <span>
              {attr.toUpperCase()}: {characterProfile.attributes[baseAttr]}
            </span>
            <button onClick={() => decrementAttribute(baseAttr)}>-</button>
            
            <button onClick={() => incrementAttribute(baseAttr)}>+</button>
          </div>
        );
      })}
    </div>
  );
};

export default AttributeAllocator;
