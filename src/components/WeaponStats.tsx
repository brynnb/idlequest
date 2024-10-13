import React from "react";
import { Item } from "@entities/Item";
import { ItemType, getItemTypeName } from "@entities/ItemType";

interface WeaponStatsProps {
  item: Item;
}

const WeaponStats: React.FC<WeaponStatsProps> = ({ item }) => {
  return (
    <>
      <p>
        {`Type: ${getItemTypeName(Number(item.itemtype) as ItemType)} `}
        Atk Delay: {item.delay}
      </p>
      <p>DMG: {item.damage}</p>
    </>
  );
};

export default WeaponStats;
