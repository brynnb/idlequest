import React from "react";
import styled from "styled-components";

interface XPBarSubProps {
  percent: number;
}

const SubBarContainer = styled.div`
  position: absolute;
  left: 26px;
  top: 40px;
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

export const XPBarSub: React.FC<XPBarSubProps> = ({ percent }) => {
  return (
    <SubBarContainer>
      <EmptyBar
        src="/images/xpbar_subbar_empty.png"
        className="empty-xp-sub"
        alt="Empty XP sub bar"
      />
      <FullBarContainer width={`calc((${percent} * 174px) + 13px)`}>
        <FullBarImage
          src="/images/xpbar_subbar_full.png"
          className="full-xp-sub-image"
          alt="Full XP sub bar"
        />
      </FullBarContainer>
    </SubBarContainer>
  );
};
