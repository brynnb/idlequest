//this is the xp / health / mana bar that displays in the top right corner of the screen

import React from "react";
import styled from "styled-components";

interface BarProps {
  type: "health" | "mana" | "xp";
  percent: number;
  top: number;
  subbarPercent?: number;
  subbarOffset?: number;
}

const BarContainer = styled.div<{ $top: number }>`
  position: absolute;
  left: 26px;
  top: ${(props) => props.$top}px;
  width: 200px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const EmptyBar = styled.img`
  width: 100%;
  position: relative;
  top: 0;
  left: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const FullBarContainer = styled.div<{ width: string }>`
  width: ${(props) => props.width};
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const FullBarImage = styled.img`
  width: 200px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const StatBar: React.FC<BarProps> = ({
  type,
  percent,
  top,
  subbarPercent,
  subbarOffset = 24,
}) => {
  return (
    <>
      <BarContainer $top={top} data-testid={`stat-bar-${type}`} data-percent={percent}>
        <EmptyBar
          src={`/images/${type}bar_empty.png`}
          className={`empty-${type}`}
          alt={`Empty ${type} bar`}
        />
        <FullBarContainer width={`calc((${percent} * 174px) + 13px)`}>
          <FullBarImage
            src={`/images/${type}bar_full.png`}
            className={`full-${type}-image`}
            alt={`Full ${type} bar`}
          />
        </FullBarContainer>
      </BarContainer>
      {type === "xp" && subbarPercent !== undefined && (
        <CustomXPBarSub percent={subbarPercent} topOffset={subbarOffset} />
      )}
    </>
  );
};

const CustomXPBarSub: React.FC<{ percent: number; topOffset: number }> = ({
  percent,
  topOffset,
}) => {
  return (
    <XPBarSubContainer $topOffset={topOffset}>
      <FullXPContainerSub
        width={`calc((${percent} * 174px) + 13px)`}
        $topOffset={topOffset}
      >
        <FullXPImageSub
          src="/images/xpbar_subbar_full.png"
          alt="Full XP subbar"
        />
      </FullXPContainerSub>
    </XPBarSubContainer>
  );
};

const XPBarSubContainer = styled.div.attrs({ className: "xp-bar-sub" }) <{
  $topOffset: number;
}>`
  position: absolute;
  left: 26px;
  top: ${(props) => props.$topOffset}px;
  width: 200px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const FullXPContainerSub = styled.div.attrs({
  className: "full-xp-container-sub",
}) <{
  width: string;
  $topOffset: number;
}>`
  width: ${(props) => props.width};
  overflow: hidden;
  position: absolute;
  top: ${(props) => (props.$topOffset === 10 ? "-11px" : "15px")};
  left: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const FullXPImageSub = styled.img.attrs({ className: "full-xp-image-sub" })`
  width: 200px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

export default StatBar;
