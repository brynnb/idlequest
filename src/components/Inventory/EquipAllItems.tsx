import React from "react";
import { useInventoryActions } from "@hooks/useInventoryActions";

const EquipAllItems: React.FC = () => {
  const { handleEquipAllItems } = useInventoryActions();

  return <button onClick={handleEquipAllItems}>Equip All Items</button>;
};

export default EquipAllItems;
