import React, { useEffect } from "react";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";

const baseAttributes = [
  "str",
  "sta",
  "dex",
  "agi",
  "int",
  "wis",
  "cha",
] as const;

const AttributeAllocator: React.FC = () => {
  const { attributes, setAttributes, attributePoints, updateBaseAttributes } =
    useCharacterCreatorStore();

  useEffect(() => {
    updateBaseAttributes();
  }, []);

  const incrementAttribute = (attr: keyof typeof attributes) => {
    if (attributePoints > 0) {
      setAttributes({ ...attributes, [attr]: attributes[attr] + 1 });
    }
  };

  const decrementAttribute = (attr: keyof typeof attributes) => {
    const baseValue = attributes[`base_${attr}`];
    if (attributes[attr] > 0 && (attributes[`base_${attr}`] + attributes[attr]) > baseValue) {
      setAttributes({ ...attributes, [attr]: attributes[attr] - 1 });
    }
  };

  return (
    <div>
      <h2>Attribute Allocator</h2>
      <div>
        <span>Attribute Points: {attributePoints}</span>
      </div>
      {baseAttributes.map((attr) => (
        <div key={attr}>
          <span>{attr.toUpperCase()}:</span>
          <button 
            onClick={() => decrementAttribute(attr)}
            disabled={attributes[attr] === 0 || (attributes[`base_${attr}`] + attributes[attr]) <= attributes[`base_${attr}`]}
          >
            -
          </button>
          <span>{attributes[`base_${attr}`] + attributes[attr]}</span>
          <button onClick={() => incrementAttribute(attr)} disabled={attributePoints === 0}>
            +
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttributeAllocator;
