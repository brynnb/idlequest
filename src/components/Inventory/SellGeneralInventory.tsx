import React, { useState, useEffect } from "react";
import { useInventorySelling } from "@hooks/useInventorySelling";

const SellGeneralInventory: React.FC = () => {
  const [autoSell, setAutoSell] = useState(true);
  const [deleteNoDrop, setDeleteNoDrop] = useState(true);
  const { sellGeneralInventory, isGeneralInventoryFull } = useInventorySelling();

  useEffect(() => {
    if (autoSell && isGeneralInventoryFull()) {
      sellGeneralInventory(deleteNoDrop);
    }
  }, [autoSell, deleteNoDrop, sellGeneralInventory, isGeneralInventoryFull]);

  return (
    <div>
      <button onClick={() => sellGeneralInventory(deleteNoDrop)}>
        Sell General Inventory
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoSell}
          onChange={(e) => setAutoSell(e.target.checked)}
        />
        Auto sell when full
      </label>
      <label>
        <input
          type="checkbox"
          checked={deleteNoDrop}
          onChange={(e) => setDeleteNoDrop(e.target.checked)}
        />
        Delete NoDrop Items
      </label>
    </div>
  );
};

export default SellGeneralInventory;
