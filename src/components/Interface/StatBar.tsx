import React from "react";
import styled from "styled-components";


interface BarProps {
  type: "health" | "mana" | "xp";
  percent: number;
  top: number;
}

const StatBar: React.FC<BarProps> = ({ type, percent, top }) => {
  const BarContainer = styled.div.attrs({ className: `${type}-bar` })`
    position: absolute;
    left: 26px;
    top: ${top}px;
    width: 200px;
  `;

  const EmptyBar = styled.img.attrs({ className: "empty-bar" })`
    width: 100%;
    position: relative;
    top: 0;
    left: 0;
  `;

  const FullBarContainer = styled.div.attrs({
    className: "full-bar-container",
  })<{
    width: string;
  }>`
    width: ${(props) => props.width};
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
  `;

  const FullBarImage = styled.img.attrs({ className: "full-bar-image" })`
    width: 200px;
  `;

  return (
    <>
      <BarContainer>
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
      {type === "xp" && <XPBarSub percent={percent} />}
    </>
  );
};

const XPBarSub: React.FC<{ percent: number }> = ({ percent }) => {
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