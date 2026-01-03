import { useEffect, useMemo } from "react";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";
import styled from "styled-components";

const DeitySelectorContainer = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 50px;
`;

const Title = styled.h2`
  font-family: "Times New Roman", Times, serif;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 50px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  margin: 0 0 10px 0;
  color: white;
  width: 100%;
`;

const RightColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const DeityButtonsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 300px;
`;

const DeityButton = styled.button<{
  $isSelected: boolean;
  $isDisabled?: boolean;
}>`
  width: 345px;
  height: 45px;
  background-image: ${({ $isSelected }) =>
    $isSelected
      ? "url('/images/ui/actionbuttonpress.png')"
      : "url('/images/ui/actionbutton.png')"};
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: none;
  cursor: ${({ $isDisabled }) => ($isDisabled ? "not-allowed" : "pointer")};
  outline: none;
  color: ${({ $isDisabled }) => ($isDisabled ? "#363333" : "black")};
  font-family: "Times New Roman", Times, serif;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.6 : 1)};
  white-space: nowrap;
  font-size: 30px;
  text-overflow: ellipsis;
  overflow: hidden;
  &:focus {
    outline: none;
  }
`;

const DescriptionBox = styled.div`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 20px;
  color: #e0e0e0;
  font-size: 24px;
  line-height: 1.6;
  min-height: 200px;
  // font-family: "Times New Roman", Times, serif;
`;

const DeitySelector = () => {
  const { selectedDeity, setSelectedDeity, selectedRace, selectedClass } =
    useCharacterCreatorStore();
  const deities = useStaticDataStore((state) => state.deities);
  const combinations = useStaticDataStore(
    (state) => state.charCreateCombinations
  );

  const compatibleDeities = useMemo(() => {
    return combinations
      .filter(
        (combination) =>
          combination.race === selectedRace?.id &&
          combination.class === selectedClass?.id
      )
      .map((combination) => combination.deity);
  }, [selectedRace, selectedClass, combinations]);

  const onSelectDeity = (deityId: number) => {
    const deity = deities.find((d) => d.id === deityId);
    if (deity && compatibleDeities.includes(deityId)) {
      setSelectedDeity(deity);
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
  }, [compatibleDeities, selectedDeity, setSelectedDeity, deities]);

  return (
    <DeitySelectorContainer>
      <DeityButtonsColumn>
        {deities.map((deity) => (
          <DeityButton
            key={deity.id}
            onClick={() => onSelectDeity(deity.id)}
            disabled={!compatibleDeities.includes(deity.id)}
            $isSelected={selectedDeity?.id === deity.id}
            $isDisabled={!compatibleDeities.includes(deity.id)}
          >
            {deity.alt_name || deity.name}
          </DeityButton>
        ))}
      </DeityButtonsColumn>
      <RightColumn>
        <Title>Choose A Deity</Title>
        <DescriptionBox>
          {selectedDeity?.description ||
            "Select a deity to see its description."}
        </DescriptionBox>
      </RightColumn>
    </DeitySelectorContainer>
  );
};

export default DeitySelector;
