import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";

const StatInfoBar: React.FC = () => {
  const { deleteItemOnCursor, hoveredItem } = usePlayerCharacterStore();
  const { toggleInventory } = useGameStatusStore();
  
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "268px",
            height: "1080px",
            backgroundImage: 'url("/images/ui/statbarbackground.png")',
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />
      </>
    );
  };

  export default StatInfoBar;