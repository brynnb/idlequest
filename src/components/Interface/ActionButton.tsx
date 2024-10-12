import React, { useState } from "react";
import styled from "styled-components";

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
  &:focus {
    outline: none;
  }
  ${({ $customCSS }) => $customCSS}
`;

interface ActionButtonProps {
  text: string;
  onClick: () => void;
  marginBottom?: string;
  customCSS?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  text, 
  onClick, 
  marginBottom = "7px",
  customCSS 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <StyledActionButton
      $isPressed={isPressed}
      $marginBottom={marginBottom}
      $customCSS={customCSS}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
    >
      {text}
    </StyledActionButton>
  );
};

export default ActionButton;
