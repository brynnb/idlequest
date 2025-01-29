import React from "react";
import styled from "styled-components";

interface TooltipProps {
  text: string;
  isVisible: boolean;
}

const TooltipContainer = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: ${({ $isVisible }) => ($isVisible ? "auto" : "none")};
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transition: opacity 0.2s;
  z-index: 9999;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  cursor: default;
`;

const Tooltip: React.FC<TooltipProps> = ({ text, isVisible }) => {
  return <TooltipContainer $isVisible={isVisible}>{text}</TooltipContainer>;
};

export default Tooltip;
