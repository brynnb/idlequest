import styled from "styled-components";

const StyledGroupContainer = styled.div`
  width: 113px;
  height: 135px;
  padding-left: 17px;
  position: absolute;
  top: 133px;
  overflow-x: hidden;
  overflow-y: auto;
`;

const GroupMember = styled.div`
  width: 100%;
  height: 27px;
  position: relative;
  font-size: 11px;
`;

const GroupMemberName = styled.span`
  padding-left: 7px;
  white-space: nowrap;
  font-size: 9pt;
  color: #d1d2d3;
`;

const HealthBarMember = styled.div`
  position: absolute;
  left: 3px;
  top: 15px;
  width: 110px;
`;

const EmptyHealthImage = styled.img`
  width: 100%;
  position: relative;
  top: 0;
  left: 0;
`;

const FullHealthContainer = styled.div`
  width: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
`;

const FullHealthImage = styled.img`
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
