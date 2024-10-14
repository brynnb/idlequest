//this is the xp / health / mana bar that displays in the top right corner of the screen

import React from "react";
import styled from "styled-components";

interface BarProps {
  type: "health" | "mana" | "xp";
  percent: number;
  top: number;
  subbarPercent?: number;
}

const BarContainer = styled.div<{ $top: number }>`
  position: absolute;
  left: 26px;
  top: ${(props) => props.$top}px;
  width: 200px;
`;

const EmptyBar = styled.img`
  width: 100%;
  position: relative;
  top: 0;
  left: 0;
`;

const FullBarContainer = styled.div<{ width: string }>`
  width: ${(props) => props.width};
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
`;

const FullBarImage = styled.img`
  width: 200px;
`;

const StatBar: React.FC<BarProps> = ({ type, percent, top, subbarPercent }) => {
  return (
    <>
      <BarContainer $top={top}>
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
        <XPBarSub percent={subbarPercent} />
      )}
    </>
  );
};

const XPBarSubContainer = styled.div.attrs({ className: "xp-bar-sub" })`
  position: absolute;
  left: 26px;
  top: 24px;
  width: 200px;
`;

const FullXPContainerSub = styled.div.attrs({
  className: "full-xp-container-sub",
})<{
  width: string;
}>`
  width: ${(props) => props.width};
  overflow: hidden;
  position: absolute;
  top: 15px;
  left: 0;
`;

const FullXPImageSub = styled.img.attrs({ className: "full-xp-image-sub" })`
  width: 200px;
`;

const XPBarSub: React.FC<{ percent: number }> = ({ percent }) => {
  return (
    <XPBarSubContainer>
      <FullXPContainerSub width={`calc((${percent} * 174px) + 13px)`}>
        <FullXPImageSub
          src="/images/xpbar_subbar_full.png"
          alt="Full XP subbar"
        />
      </FullXPContainerSub>
    </XPBarSubContainer>
  );
};

export default StatBar;
