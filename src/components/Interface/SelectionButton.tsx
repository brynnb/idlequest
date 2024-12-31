import styled from "styled-components";

interface SelectionButtonProps {
  $isSelected: boolean;
  $isDisabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const StyledButton = styled.button.attrs({ className: "selection-button" })<{
  $isSelected: boolean;
  $isDisabled?: boolean;
}>`
  width: 230px;
  height: 70px;
  background-image: ${({ $isSelected }) =>
    $isSelected
      ? "url('/images/ui/actionbuttonpress.png')"
      : "url('/images/ui/actionbutton.png')"};
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: none;
  cursor: ${({ $isDisabled }) => ($isDisabled ? "not-allowed" : "pointer")};
  outline: none;
  color: ${({ $isDisabled }) => ($isDisabled ? "#363333" : "black")};
  font-family: "Times New Roman", Times, serif;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  margin-bottom: 3px;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.6 : 1)};
  white-space: nowrap;
  padding-left: 60px;
  padding-right: 60px;
  font-size: ${({ children }) =>
    typeof children === "string" && children.length > 9
      ? "clamp(12px, 24px, 27px)"
      : "clamp(12px, 34px, 30px)"};
  text-overflow: ellipsis;
  overflow: hidden;
  &:focus {
    outline: none;
  }
`;

const SelectionButton = ({
  $isSelected,
  $isDisabled,
  onClick,
  children,
  disabled,
}: SelectionButtonProps) => {
  return (
    <StyledButton
      $isSelected={$isSelected}
      $isDisabled={$isDisabled}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </StyledButton>
  );
};

export default SelectionButton;
