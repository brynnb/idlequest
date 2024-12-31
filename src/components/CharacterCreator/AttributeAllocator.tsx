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
  text-align: center;
  display: block;
`;

const LargeStyledText = styled(StyledText)`
  font-size: 52px;
  display: inline-block;
  min-width: 150px;
  width: 150px;
  flex: 0 0 150px;
  text-align: left;
  color: rgba(0, 0, 0, 0.6);
  text-shadow: 0px 1px 0px rgba(210, 210, 210, 0.3),
    0px -1px 0px rgba(0, 0, 0, 1);
  padding: 5px 10px;
  border-radius: 3px;
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
  font-size: 26px;
`;

const AdjustButton = styled.button`
  width: 20px;
  height: 20px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  color: #000000;
  border: 2px solid black;
  outline: 2px solid #979494;
  border-radius: 0;
  background-color: #e8e5e5;
`;

const AttributeRow = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
  width: 100%;
  flex-wrap: nowrap;
`;

const AttributeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
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
        <StyledText>Ability Points Left: {attributePoints}</StyledText>
      </div>

      {baseAttributes.map((attr) => (
        <AttributeRow key={attr}>
          <LargeStyledText>{attr.toUpperCase()}:</LargeStyledText>
          <AttributeControls>
            <AdjustButton
              onClick={() => decrementAttribute(attr)}
              disabled={
                attributes[attr] === 0 ||
                attributes[`base_${attr}`] + attributes[attr] <=
                  attributes[`base_${attr}`]
              }
            >
              ‒
            </AdjustButton>
            <AttributeNumber>
              {attributes[`base_${attr}`] + attributes[attr]}
            </AttributeNumber>
            <AdjustButton
              onClick={() => incrementAttribute(attr)}
              disabled={attributePoints === 0}
            >
              +
            </AdjustButton>
          </AttributeControls>
        </AttributeRow>
      ))}

      <div style={{ textAlign: "center" }}>
        <StyledText>Auto-allocation assigns optimal stats</StyledText>
        <AttributeAutoAllocatorButton />
      </div>
    </div>
  );
};

export default AttributeAllocator;
