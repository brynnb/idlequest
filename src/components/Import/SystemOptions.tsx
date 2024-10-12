import React from 'react';
import ActionButton from '../Interface/ActionButton';

const SystemOptions = () => {
  const buttonWidth = "164px";

  return (
    <div className="system_options" style={{ marginLeft: '21px', marginTop: '30px' }}>
      <ActionButton text="Help" onClick={() => {}} customCSS={`width: ${buttonWidth};`} />
      <ActionButton text="Options" onClick={() => {}} customCSS={`width: ${buttonWidth};`} />
      <ActionButton text="Persona" onClick={() => {}} customCSS={`width: ${buttonWidth}; margin-top: 25px;`} />
      <div className="class_graphic_container">
        <div className="class_graphic_image"></div>
        <div className="spell-book-graphic"></div>
      </div>
      <ActionButton text="Spells" onClick={() => {}} customCSS={`width: ${buttonWidth}; margin-top: 403px;`} />
      <ActionButton text="View" onClick={() => {}} customCSS={`width: ${buttonWidth};`} />
    </div>
  );
};

export default SystemOptions;
