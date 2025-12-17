import { useEffect, useRef } from "react";
import CharacterCreator from "@components/CharacterCreator/CharacterCreator";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";

const CharacterCreatorPage = () => {
  const resetStore = useCharacterCreatorStore((state) => state.resetStore);
  const initializeDefaults = useCharacterCreatorStore(
    (state) => state.initializeDefaults
  );
  const races = useStaticDataStore((state) => state.races);
  const classes = useStaticDataStore((state) => state.classes);
  const charCreateCombinations = useStaticDataStore(
    (state) => state.charCreateCombinations
  );
  const hasReset = useRef(false);

  // Reset the character creator store when this page mounts (only once)
  // Then initialize with a random valid race/class combination
  useEffect(() => {
    if (!hasReset.current && races.length > 0 && classes.length > 0) {
      hasReset.current = true;
      resetStore();
      // Initialize with random valid race/class
      initializeDefaults(races, classes, charCreateCombinations);
    }
  }, [resetStore, initializeDefaults, races, classes, charCreateCombinations]);

  return (
    <>
      <CharacterCreator />
    </>
  );
};

export default CharacterCreatorPage;
