import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const ScrollContainer = styled.div`
  width: 28px;
  height: 300px;
  position: absolute;
  background-image: url(/images/ui/scroll/scrollbarbackground.png);
  background-size: cover;
  right: 0px;
  top: 0px;
`;

const ScrollButton = styled.button<{ $isUp: boolean }>`
  width: 24px;
  height: 42px;
  position: absolute;
  left: 4px;
  ${(props) => (props.$isUp ? "top: 0;" : "bottom: 0;")}
  background-image: url(${(props) =>
    props.$isUp
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
const ScrollIndicator = styled.div.attrs<{ $position: number }>(({ $position }) => ({ //this approach is used to minimize CSS classes and potential performance issues
  style: {
    top: `${$position}px`,
  },
}))`
  width: 24px;
  height: 24px;
  position: absolute;
  left: 4px;
  background-image: url("/images/ui/scroll/scrollpositionindicator.png");
  background-size: cover;
  cursor: pointer;
`;

interface VerticalScrollProps {
  contentHeight: number;
  visibleHeight: number;
  onScroll: (scrollPosition: number) => void;
  initialScrollPosition?: number;
}

const VerticalScroll: React.FC<VerticalScrollProps> = ({
  contentHeight,
  visibleHeight,
  onScroll,
  initialScrollPosition = 0,
}) => {
  const [scrollPosition, setScrollPosition] = useState(initialScrollPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollPosition = useRef(0);

  const SCROLL_BUTTON_HEIGHT = 42;
  const SCROLL_INDICATOR_HEIGHT = 24;
  const SCROLL_TOP_LIMIT = SCROLL_BUTTON_HEIGHT;
  const SCROLL_BOTTOM_LIMIT = 300 - SCROLL_BUTTON_HEIGHT - SCROLL_INDICATOR_HEIGHT;

  const scrollBarHeight = SCROLL_BOTTOM_LIMIT - SCROLL_TOP_LIMIT;
  const scrollRatio = scrollBarHeight / Math.max(contentHeight - visibleHeight, 1);
  const maxScroll = Math.max(0, contentHeight - visibleHeight);

  useEffect(() => {
    updateScrollPosition(maxScroll);
  }, [contentHeight, visibleHeight]);

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
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = (e.clientY - startY.current) / scrollRatio;
    updateScrollPosition(startScrollPosition.current + delta);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const indicatorPosition = SCROLL_TOP_LIMIT + scrollPosition * scrollRatio;

  return (
    <ScrollContainer ref={containerRef}>
      <ScrollButton $isUp={true} onClick={() => handleScroll(-30)} />
      <ScrollIndicator
        $position={indicatorPosition}
        onMouseDown={handleMouseDown}
      />
      <ScrollButton $isUp={false} onClick={() => handleScroll(30)} />
    </ScrollContainer>
  );
};

export default VerticalScroll;
