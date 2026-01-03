import styled from "styled-components";
import StatBar from "../Interface/StatBar";
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
  position: relative;
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
          <StatBar type="health" percent={member.healthPercent} top={0} />
        </GroupMember>
      ))}
    </StyledGroupContainer>
  );
};

export default GroupContainer;
