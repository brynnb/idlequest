import React from 'react';
import DeleteItemOnCursorButton from './DeleteItemOnCursorButton';
import EquippedItemsInventory from './EquippedItemsInventory';
import GeneralInventorySlots from './GeneralInventorySlots';

const InventorySidebar: React.FC = () => {
  return (
    <>
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '272px',
        height: '1080px',
        backgroundImage: 'url("/images/ui/rightsidebarinventory.png")',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    />
    <EquippedItemsInventory />
    <GeneralInventorySlots />
    <DeleteItemOnCursorButton />
  );
  </>
  );    
};

export default InventorySidebar;

