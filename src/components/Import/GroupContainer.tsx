import styled from "styled-components";

const StyledGroupContainer = styled.div.attrs({
  className: "styled-group-container",
})`
  width: 129px;
  height: 155px;
  padding-left: 17px;
  position: absolute;
  top: 133px;
  overflow-x: hidden;
  overflow-y: auto;

  padding-top: 5px;
`;

const GroupMember = styled.div.attrs({
  className: "group-member",
})`
  width: 100%;
  height: 27px;
  position: relative;
  font-size: 11px;
`;

const GroupMemberName = styled.span.attrs({
  className: "group-member-name",
})`
  padding-left: 7px;
  white-space: nowrap;
  font-size: 9pt;
  color: #d1d2d3;
`;

const HealthBarMember = styled.div.attrs({
  className: "health-bar-member",
})`
  position: absolute;
  left: 3px;
  top: 15px;
  width: 110px;
`;

const EmptyHealthImage = styled.img.attrs({
  className: "empty-health-image",
})`
  width: 100%;
  position: relative;
  top: 0;
  left: 0;
`;

const FullHealthContainer = styled.div.attrs({
  className: "full-health-container",
})`
  width: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
`;

const FullHealthImage = styled.img.attrs({
  className: "full-health-image",
})`
  width: 110px;
`;

const GroupContainer = () => {
  const partyMembers = [
    { username: "Member1", healthPercent: 0.8 },
    { username: "Member2", healthPercent: 0.6 },
  ];

  return (
    <StyledGroupContainer>
      {partyMembers.map((member, index) => (
        <GroupMember key={index}>
          <GroupMemberName className="name-text">
            {member.username}
          </GroupMemberName>
          <HealthBarMember>
            <EmptyHealthImage
              src="/images/healthbar_empty.png"
              alt="Empty health bar"
            />
            <FullHealthContainer
              style={{ width: `${member.healthPercent * 84 + 13}px` }}
            >
              <FullHealthImage
                src="/images/healthbar_full.png"
                alt="Full health bar"
              />
            </FullHealthContainer>
          </HealthBarMember>
        </GroupMember>
      ))}
    </StyledGroupContainer>
  );
};

export default GroupContainer;
