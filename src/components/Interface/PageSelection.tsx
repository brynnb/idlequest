import React from "react";
import styled from "styled-components";

const Container = styled.div.attrs({ className: "page-selection" })`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const PageButton = styled.button.attrs({ className: "page-button" })<{
  $isPressed: boolean;
}>`
  width: 47px;
  height: 30px;
  background-image: ${({ $isPressed }) =>
    $isPressed
      ? "url('/images/ui/macro/paginateleftpress.png')"
      : "url('/images/ui/macro/paginateleft.png')"};
  background-size: cover;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  &:last-child {
    background-image: ${({ $isPressed }) =>
      $isPressed
        ? "url('/images/ui/macro/paginaterightpress.png')"
        : "url('/images/ui/macro/paginateright.png')"};
  }

  &:focus {
    outline: none;
  }
`;

const PageName = styled.p.attrs({ className: "page-name" })<{
  $isNumeric?: boolean;
  $useAttributeBackground?: boolean;
}>`
  margin: 0 10px;
  font-size: 18px;
  color: white;
  min-width: ${({ $isNumeric }) => ($isNumeric ? "20px" : "100px")};
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  ${({ $useAttributeBackground }) =>
    $useAttributeBackground &&
    `
    width: 120px;
    height: 30px;
    background: url(/images/ui/charactercreation/attributenumberbackgroundlightsmall.png);
    background-size: 100% 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin:0px;
  `}
`;

interface PageSelectionProps {
  pages: string[];
  currentPage: string;
  onPageChange: (direction: "left" | "right") => void;
  useAttributeBackground?: boolean;
}

const PageSelection: React.FC<PageSelectionProps> = ({
  currentPage,
  onPageChange,
  useAttributeBackground = false,
}) => {
  const [pressedPageButtons, setPressedPageButtons] = React.useState({
    left: false,
    right: false,
  });

  const handlePageButtonPress = (direction: "left" | "right") => {
    setPressedPageButtons((prev) => ({ ...prev, [direction]: true }));
    onPageChange(direction);
  };

  const handlePageButtonRelease = (direction: "left" | "right") => {
    setPressedPageButtons((prev) => ({ ...prev, [direction]: false }));
  };

  const isNumeric = !isNaN(Number(currentPage));

  return (
    <Container>
      <PageButton
        $isPressed={pressedPageButtons.left}
        onMouseDown={() => handlePageButtonPress("left")}
        onMouseUp={() => handlePageButtonRelease("left")}
        onMouseLeave={() => handlePageButtonRelease("left")}
      />
      <PageName
        $isNumeric={isNumeric}
        $useAttributeBackground={useAttributeBackground}
      >
        {currentPage}
      </PageName>
      <PageButton
        $isPressed={pressedPageButtons.right}
        onMouseDown={() => handlePageButtonPress("right")}
        onMouseUp={() => handlePageButtonRelease("right")}
        onMouseLeave={() => handlePageButtonRelease("right")}
      />
    </Container>
  );
};

export default PageSelection;
