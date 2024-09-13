import React from "react";
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
  const { attributes, setAttributes, attributePoints } = useCharacterCreatorStore();

  const incrementAttribute = (attr: string) => {
    if (attributePoints > 0) {
      setAttributes({ ...attributes, [attr]: attributes[attr] + 1 });
    }
  };

  const decrementAttribute = (attr: string) => {
    if (attributes[attr] > 0) {
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
          <button onClick={() => decrementAttribute(attr)}>-</button>
          <span>{attributes[`base_${attr}`] + attributes[attr]}</span>
          <button onClick={() => incrementAttribute(attr)}>+</button>
        </div>
      ))}
    </div>
  );
};

export default AttributeAllocator;
