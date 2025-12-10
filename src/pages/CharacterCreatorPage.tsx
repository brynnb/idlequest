import { useEffect, useRef } from "react";
import CharacterCreator from "@components/CharacterCreator/CharacterCreator";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";

const CharacterCreatorPage = () => {
  const resetStore = useCharacterCreatorStore((state) => state.resetStore);
  const hasReset = useRef(false);

  // Reset the character creator store when this page mounts (only once)
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      resetStore();
    }
  }, [resetStore]);

  return (
    <>
      <CharacterCreator />
    </>
  );
};

export default CharacterCreatorPage;
