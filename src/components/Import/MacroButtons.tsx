import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div.attrs({ className: "macro-buttons-container" })`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageSelection = styled.div.attrs({ className: "page-selection" })`
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

const PageNumber = styled.p.attrs({ className: "page-number" })`
  margin: 0 10px;
  font-size: 18px;
  color: white;
`;

const MacroButtonsGrid = styled.div.attrs({ className: "macro-buttons-grid" })`
  display: grid;
  grid-template-columns: repeat(2, 95px);
  grid-template-rows: repeat(3, 95px);
  gap: 14px;
`;

const MacroButton = styled.button.attrs({ className: "macro-button" })<{
  $isPressed: boolean;
}>`
  width: 95px;
  height: 95px;
  background-image: ${({ $isPressed }) =>
    $isPressed
      ? "url('/images/ui/macro/macrobuttonpress.png')"
      : "url('/images/ui/macro/macrobutton.png')"};
  background-size: cover;
  border: none;
  cursor: pointer;
  color: black;
  font-size: 20px;
  font-family: "Times New Roman", Times, serif;
  font-weight: bold;
  outline: none;

  &:focus {
    outline: none;
  }
`;

const MacroButtons = () => {
  const [page, setPage] = useState(1);
  const [pressedButtons, setPressedButtons] = useState<{
    [key: number]: boolean;
  }>({});
  const [pressedPageButtons, setPressedPageButtons] = useState({
    left: false,
    right: false,
  });

  const handlePageChange = (direction: "left" | "right") => {
    setPage((prev) =>
      direction === "left" ? Math.max(1, prev - 1) : prev + 1
    );
  };

  const handleMacroButtonPress = (num: number) => {
    setPressedButtons((prev) => ({ ...prev, [num]: true }));
  };

  const handleMacroButtonRelease = (num: number) => {
    setPressedButtons((prev) => ({ ...prev, [num]: false }));
  };

  const handlePageButtonPress = (direction: "left" | "right") => {
    setPressedPageButtons((prev) => ({ ...prev, [direction]: true }));
    handlePageChange(direction);
  };

  const handlePageButtonRelease = (direction: "left" | "right") => {
    setPressedPageButtons((prev) => ({ ...prev, [direction]: false }));
  };

  return (
    <Container>
      <PageSelection>
        <PageButton
          $isPressed={pressedPageButtons.left}
          onMouseDown={() => handlePageButtonPress("left")}
          onMouseUp={() => handlePageButtonRelease("left")}
          onMouseLeave={() => handlePageButtonRelease("left")}
        />
        <PageNumber>{page}</PageNumber>
        <PageButton
          $isPressed={pressedPageButtons.right}
          onMouseDown={() => handlePageButtonPress("right")}
          onMouseUp={() => handlePageButtonRelease("right")}
          onMouseLeave={() => handlePageButtonRelease("right")}
        />
      </PageSelection>
      <MacroButtonsGrid>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <MacroButton
            key={num}
            $isPressed={pressedButtons[num] || false}
            onMouseDown={() => handleMacroButtonPress(num)}
            onMouseUp={() => handleMacroButtonRelease(num)}
            onMouseLeave={() => handleMacroButtonRelease(num)}
          >
            {num}
          </MacroButton>
        ))}
      </MacroButtonsGrid>
    </Container>
  );
};

export default MacroButtons;
