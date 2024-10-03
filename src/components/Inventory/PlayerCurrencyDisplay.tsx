import React from "react";
import usePlayerCharacterStore from "../../stores/PlayerCharacterStore";

const PlayerCurrencyDisplay: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  return (
    <div>
      <p>Currency:</p>
      <p>Platinum: {characterProfile.platinum || 0}</p>
      <p>Gold: {characterProfile.gold || 0}</p>
      <p>Silver: {characterProfile.silver || 0}</p>
      <p>Copper: {characterProfile.copper || 0}</p>
    </div>
  );
};

export default PlayerCurrencyDisplay;
