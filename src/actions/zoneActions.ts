import useGameStatusStore from "@stores/GameStatusStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

export const changeZone = async (newZoneId: number) => {
  const setCurrentZone = useGameStatusStore.getState().setCurrentZone;
  const setCharacterZone = usePlayerCharacterStore.getState().setCharacterZone;

  await setCurrentZone(newZoneId);
  setCharacterZone(newZoneId);
};
