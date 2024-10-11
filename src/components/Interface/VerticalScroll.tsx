import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const ScrollContainer = styled.div`
  width: 28px;
  height: 300px;
  position: absolute;
  background-image: url(/images/ui/scroll/scrollbarbackground.png);
  background-size: cover;
  right: 0px;
  top: 30px;
`;

const ScrollButton = styled.button<{ isUp: boolean }>`
  width: 24px;
  height: 42px;
  position: absolute;
  left: 4px;
  ${(props) => (props.isUp ? "top: 0;" : "bottom: 0;")}
  background-image: url(${(props) =>
    props.isUp
      ? "/images/ui/scroll/scrolluparrow.png"
      : "/images/ui/scroll/scrolldownarrow.png"});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  box-sizing: border-box;
`;

const ScrollIndicator = styled.div<{ position: number }>`
  width: 24px;
  height: 24px;

  position: absolute;
  left: 4px;
  top: ${(props) => props.position}px;
  background-image: url("/images/ui/scroll/scrollpositionindicator.png");
  background-size: cover;
  cursor: pointer;
`;

interface VerticalScrollProps {
  contentHeight: number;
  onScroll: (scrollPosition: number) => void;
}

const VerticalScroll: React.FC<VerticalScrollProps> = ({
  contentHeight,
  onScroll,
}) => {
  const [scrollPosition, setScrollPosition] = useState(106); //TODO: make this dynamic
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollPosition = useRef(0);

  const scrollBarHeight = 200; // Total height minus button heights
  const scrollRatio = scrollBarHeight / contentHeight;
  const maxScroll = contentHeight - scrollBarHeight;

  const updateScrollPosition = (newPosition: number) => {
    const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
    setScrollPosition(clampedPosition);
    onScroll(clampedPosition);
  };

  const handleScroll = (amount: number) => {
    updateScrollPosition(scrollPosition + amount);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startScrollPosition.current = scrollPosition;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = (e.clientY - startY.current) / scrollRatio;
    updateScrollPosition(startScrollPosition.current + delta);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <ScrollContainer ref={containerRef}>
      <ScrollButton isUp={true} onClick={() => handleScroll(-10)} />
      <ScrollIndicator
        position={20 + scrollPosition * scrollRatio}
        onMouseDown={handleMouseDown}
      />
      <ScrollButton isUp={false} onClick={() => handleScroll(10)} />
    </ScrollContainer>
  );
};

export default VerticalScroll;
