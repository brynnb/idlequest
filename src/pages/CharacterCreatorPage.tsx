import { useEffect, useRef } from "react";
import CharacterCreator from "@components/CharacterCreator/CharacterCreator";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";
import LoadingScreen from "@components/LoadingScreen";
import { useMinimumLoadingTime } from "@hooks/useMinimumLoadingTime";

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
  const loadCharCreateData = useStaticDataStore(
    (state) => state.loadCharCreateData
  );
  const isCharCreateLoaded = useStaticDataStore(
    (state) => state.isCharCreateLoaded
  );
  const isLoadingCharCreate = useStaticDataStore(
    (state) => state.isLoadingCharCreate
  );
  const hasReset = useRef(false);

  useEffect(() => {
    loadCharCreateData();
  }, [loadCharCreateData]);

  // Reset the character creator store when this page mounts (only once)
  // Then initialize with a random valid race/class combination
  useEffect(() => {
    if (
      isCharCreateLoaded &&
      !hasReset.current &&
      races.length > 0 &&
      classes.length > 0
    ) {
      hasReset.current = true;
      resetStore();
      // Initialize with random valid race/class
      initializeDefaults(races, classes, charCreateCombinations);
    }
  }, [
    isCharCreateLoaded,
    resetStore,
    initializeDefaults,
    races,
    classes,
    charCreateCombinations,
  ]);

  const showLoading = useMinimumLoadingTime(isLoadingCharCreate || !isCharCreateLoaded);

  if (showLoading) {
    return <LoadingScreen isIndeterminate message="Preparing Norrath..." />;
  }

  return (
    <>
      <CharacterCreator />
    </>
  );
};

export default CharacterCreatorPage;
