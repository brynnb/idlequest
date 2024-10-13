import { useEffect, useMemo } from "react";
import deities from "../../../data/deities.json";
import useCharacterStore from "@stores/CharacterCreatorStore";
import charCreateCombinations from "../../../data/char_create_combinations.json";

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
    <div>
      <h2>Deity</h2>
      {deities.map((deity) => (
        <button
          key={deity.id}
          onClick={() => onSelectDeity(deity.id)}
          disabled={!compatibleDeities.includes(deity.id)}
          style={{
            backgroundColor:
              selectedDeity?.id === deity.id ? "#007bff" : "#f8f9fa",
            color: selectedDeity?.id === deity.id ? "white" : "black",
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            cursor: compatibleDeities.includes(deity.id)
              ? "pointer"
              : "not-allowed",
            opacity: compatibleDeities.includes(deity.id) ? 1 : 0.5,
          }}
        >
          {deity.name}
        </button>
      ))}
    </div>
  );
};

export default DeitySelector;
