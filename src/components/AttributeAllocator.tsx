import React, { useState, useEffect } from 'react';
import { CharacterCreationAttributes } from '../entities/CharacterCreationAttributes';

interface Props {
  attributes: CharacterCreationAttributes;
  totalPoints: number;
  onAllocationsChange: (allocations: CharacterCreationAttributes) => void;
}

const AttributeAllocator: React.FC<Props> = ({ attributes, totalPoints, onAllocationsChange }) => {
  const [allocations, setAllocations] = useState<CharacterCreationAttributes>(attributes);
  const [remainingPoints, setRemainingPoints] = useState(totalPoints);

  useEffect(() => {
    onAllocationsChange(allocations);
  }, [allocations, onAllocationsChange]);

  const handleIncrement = (attr: keyof CharacterCreationAttributes) => {
    const allocKey = `alloc_${attr.slice(5)}` as keyof CharacterCreationAttributes;
    if (remainingPoints > 0 && allocations[allocKey] < attributes[allocKey]) {
      setAllocations(prev => ({ ...prev, [allocKey]: prev[allocKey] + 1 }));
      setRemainingPoints(prev => prev - 1);
    }
  };

  const handleDecrement = (attr: keyof CharacterCreationAttributes) => {
    const allocKey = `alloc_${attr.slice(5)}` as keyof CharacterCreationAttributes;
    if (allocations[allocKey] > 0) {
      setAllocations(prev => ({ ...prev, [allocKey]: prev[allocKey] - 1 }));
      setRemainingPoints(prev => prev + 1);
    }
  };

  const baseAttributes = ['base_str', 'base_sta', 'base_dex', 'base_agi', 'base_int', 'base_wis', 'base_cha'] as const;

  return (
    <div>
      <h2>Attribute Allocator</h2>
      <p>Remaining Points: {remainingPoints}</p>
      {baseAttributes.map(attr => {
        const allocKey = `alloc_${attr.slice(5)}` as keyof CharacterCreationAttributes;
        return (
          <div key={attr}>
            <span>{attr.slice(5).toUpperCase()}: {allocations[attr] + allocations[allocKey]} </span>
            <button onClick={() => handleDecrement(attr)}>-</button>
            <span> {allocations[allocKey]} </span>
            <button onClick={() => handleIncrement(attr)}>+</button>
            <span> (Max: {attributes[allocKey]})</span>
          </div>
        );
      })}
    </div>
  );
};

export default AttributeAllocator;