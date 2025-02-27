import React, { useState } from "react";
import styled from "styled-components";
import Tooltip from "./Tooltip";

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const StyledActionButton = styled.button.attrs({ className: "action-button" })<{
  $isPressed: boolean;
  $marginBottom: string;
  $customCSS?: string;
}>`
  width: 230px;
  height: 40px;
  background-image: ${({ $isPressed }) =>
    $isPressed
      ? "url('/images/ui/actionbuttonpress.png')"
      : "url('/images/ui/actionbutton.png')"};
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
  outline: none;
  color: black;
  font-family: "Times New Roman", Times, serif;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  margin-bottom: ${({ $marginBottom }) => $marginBottom};
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  &:focus {
    outline: none;
  }
  ${({ $customCSS }) => $customCSS}
`;

interface ActionButtonProps {
  text: string;
  onClick?: () => void;
  marginBottom?: string;
  customCSS?: string;
  isToggleable?: boolean;
  isPressed?: boolean;
  tooltip?: string;
  showTooltip?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  onClick,
  marginBottom = "7px",
  customCSS,
  isToggleable = false,
  isPressed: isPressedProp,
  tooltip,
  showTooltip = false,
}) => {
  const [isInternalPressed, setIsInternalPressed] = useState(false);
  const isPressed =
    isPressedProp !== undefined ? isPressedProp : isInternalPressed;

  const handleClick = () => {
    if (isToggleable && isPressedProp === undefined) {
      setIsInternalPressed((prev) => !prev);
    }
    if (onClick && typeof onClick === "function") {
      onClick();
    }
  };

  const handleMouseEvents = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isToggleable && isPressedProp === undefined) {
      if (event.type === "mousedown") {
        setIsInternalPressed(true);
      } else if (event.type === "mouseup" || event.type === "mouseleave") {
        setIsInternalPressed(false);
      }
    }
  };

  const button = (
    <StyledActionButton
      $isPressed={isPressed}
      $marginBottom={marginBottom}
      $customCSS={customCSS}
      onMouseDown={handleMouseEvents}
      onMouseUp={handleMouseEvents}
      onMouseLeave={handleMouseEvents}
      onClick={handleClick}
    >
      {text}
    </StyledActionButton>
  );

  if (tooltip) {
    return (
      <TooltipWrapper>
        {button}
        <Tooltip text={tooltip} isVisible={showTooltip} />
      </TooltipWrapper>
    );
  }

  return button;
};

export default ActionButton;
