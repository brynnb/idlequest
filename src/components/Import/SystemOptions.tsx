import React from 'react';

const SystemOptions = () => {
  return (
    <div className="system_options">
      <button className="help_button ui_button">Help</button>
      <button className="options_button ui_button">Options</button>
      <button className="persona_button ui_button">Persona</button>
      <div className="class_graphic_container">
        <div className="class_graphic_image"></div>
        <div className="spell-book-graphic"></div>
      </div>
      <button className="spells_button ui_button">Spells</button>
      <button className="view_button ui_button">View</button>
    </div>
  );
};

export default SystemOptions;