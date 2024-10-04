import React from 'react';

const MacroButtons = () => {
  return (
    <>
      <div className="page_selection">
        <button className="left_arrow">&lt;-</button>
        <p className="page_number">1</p>
        <button className="right_arrow">-&gt;</button>
      </div>
      <div className="macro_buttons">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <button key={num} className="macro_button" id={`macro_button_${num}`}>
            {num}
          </button>
        ))}
      </div>
    </>
  );
};

export default MacroButtons;