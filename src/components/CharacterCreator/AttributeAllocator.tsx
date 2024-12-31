import React, { useEffect } from "react";
import useCharacterCreatorStore from "/src/stores/CharacterCreatorStore";
import AttributeAutoAllocatorButton from "./AttributeAutoAllocatorButton";
import styled from "styled-components";

const baseAttributes = [
  "str",
  "sta",
  "dex",
  "agi",
  "int",
  "wis",
  "cha",
] as const;

const StyledText = styled.span`
  font-family: "Times New Roman", Times, serif;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 24px;
  text-shadow: 2px 2px 4px #d6d2d2;
`;

const AttributeNumber = styled.span`
  width: 75px;
  height: 75px;
  background: url(public/images/ui/charactercreation/attributenumberbackgroundlightsmall.png);
  background-size: contain;
  background-repeat: no-repeat;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
`;

const AttributeAllocator: React.FC = () => {
  const {
    attributes,
    setAttributes,
    attributePoints,
    updateBaseAttributes,
    setAllPointsAllocated,
  } = useCharacterCreatorStore();

  useEffect(() => {
    updateBaseAttributes();
  }, []);

  useEffect(() => {
    setAllPointsAllocated(attributePoints === 0);
  }, [attributePoints, setAllPointsAllocated]);

  const incrementAttribute = (attr: keyof typeof attributes) => {
    if (attributePoints > 0) {
      setAttributes({ ...attributes, [attr]: attributes[attr] + 1 });
    }
  };

  const decrementAttribute = (attr: keyof typeof attributes) => {
    const baseValue = attributes[`base_${attr}`];
    if (
      attributes[attr] > 0 &&
      attributes[`base_${attr}`] + attributes[attr] > baseValue
    ) {
      setAttributes({ ...attributes, [attr]: attributes[attr] - 1 });
    }
  };

  return (
    <div>
      <div>
        <span>Attribute Points Left: {attributePoints}</span>
      </div>

      {baseAttributes.map((attr) => (
        <div key={attr}>
          <span>{attr.toUpperCase()}:</span>
          <button
            onClick={() => decrementAttribute(attr)}
            disabled={
              attributes[attr] === 0 ||
              attributes[`base_${attr}`] + attributes[attr] <=
                attributes[`base_${attr}`]
            }
          >
            -
          </button>
          <AttributeNumber>
            {attributes[`base_${attr}`] + attributes[attr]}
          </AttributeNumber>
          <button
            onClick={() => incrementAttribute(attr)}
            disabled={attributePoints === 0}
          >
            +
          </button>
        </div>
      ))}

      <div style={{ textAlign: "center" }}>
        <StyledText>Auto-allocation assigns optimal stats</StyledText>
        <AttributeAutoAllocatorButton />
      </div>
    </div>
  );
};

export default AttributeAllocator;
