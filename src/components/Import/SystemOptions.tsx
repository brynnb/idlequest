import ActionButton from "../Interface/ActionButton";
import useGameStatusStore from "@stores/GameStatusStore";

const SystemOptions = () => {
  const buttonWidth = "164px";
  const {
    isInventoryOpen,
    toggleInventory,
    isSpellbookOpen,
    toggleSpellbook,
    cycleVideo,
  } = useGameStatusStore();

  return (
    <div
      className="system_options"
      style={{ marginLeft: "21px", marginTop: "30px" }}
    >
      <ActionButton
        text="Help"
        onClick={() => { }}
        customCSS={`width: ${buttonWidth};`}
      />
      <ActionButton
        text="Options"
        onClick={() => { }}
        customCSS={`width: ${buttonWidth};`}
      />
      <ActionButton
        text="Persona"
        onClick={toggleInventory}
        isPressed={isInventoryOpen}
        isToggleable={true}
        customCSS={`width: ${buttonWidth}; margin-top: 25px;`}
      />
      <div className="class_graphic_container">
        <div className="class_graphic_image"></div>
        <div className="spell-book-graphic"></div>
      </div>
      <ActionButton
        text="Spells"
        onClick={toggleSpellbook}
        isPressed={isSpellbookOpen}
        isToggleable={true}
        customCSS={`width: ${buttonWidth}; margin-top: 403px;`}
      />
      <ActionButton
        text="View"
        onClick={cycleVideo}
        customCSS={`width: ${buttonWidth};`}
      />
    </div>
  );
};

export default SystemOptions;
