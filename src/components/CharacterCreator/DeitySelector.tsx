import { useEffect, useMemo } from "react";
import deities from "/data/deities.json";
import useCharacterStore from "@stores/CharacterCreatorStore";
import charCreateCombinations from "/data/char_create_combinations.json";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

const DeitySelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const DeitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  width: 100%;
`;

const Title = styled.h2`
  font-family: "Times New Roman", Times, serif;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 32px;
  text-shadow: 2px 2px 4px #d6d2d2;
  text-align: center;
  margin-bottom: 20px;
`;

const DeitySelector = () => {
  const { selectedDeity, setSelectedDeity, selectedRace, selectedClass } =
    useCharacterStore();

  const compatibleDeities = useMemo(() => {
    return charCreateCombinations
      .filter(
        (combination) =>
          combination.race === selectedRace?.id &&
          combination.class === selectedClass?.id
      )
      .map((combination) => combination.deity);
  }, [selectedRace, selectedClass]);

  const onSelectDeity = (deityId: number) => {
    const selectedDeity = deities.find((deity) => deity.id === deityId);
    if (selectedDeity && compatibleDeities.includes(deityId)) {
      setSelectedDeity(selectedDeity);
    }
  };

  useEffect(() => {
    if (!selectedDeity || !compatibleDeities.includes(selectedDeity.id)) {
      const firstCompatibleDeity = deities.find((deity) =>
        compatibleDeities.includes(deity.id)
      );
      if (firstCompatibleDeity) {
        setSelectedDeity(firstCompatibleDeity);
      }
    }
  }, [compatibleDeities, selectedDeity, setSelectedDeity]);

  return (
    <DeitySelectorContainer>
      <Title>Choose Your Deity</Title>
      <DeitiesGrid>
        {deities.map((deity) => (
          <SelectionButton
            key={deity.id}
            onClick={() => onSelectDeity(deity.id)}
            disabled={!compatibleDeities.includes(deity.id)}
            $isSelected={selectedDeity?.id === deity.id}
            $isDisabled={!compatibleDeities.includes(deity.id)}
          >
            {deity.name}
          </SelectionButton>
        ))}
      </DeitiesGrid>
    </DeitySelectorContainer>
  );
};

export default DeitySelector;
