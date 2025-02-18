import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./StartingZoneSelector";
import SubmitCharacter from "./SubmitCharacter";
import styled from "styled-components";
import classes from "@data/json/classes.json";
import CharacterClass from "@entities/CharacterClass";

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: 220px 500px 220px 260px;
  gap: 20px;
  height: 1040px;
  width: 1400px;
`;

const NavigationContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
`;

const StoryText = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  line-height: 1.6;
  max-width: 800px;
  margin: 40px auto;
  text-align: center;
  color: #2c2c2c;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background: #4a4a4a;
  color: white;
  border: none;
  border-radius: 4px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #5a5a5a;
  }
`;

const CharacterCreator = () => {
  const {
    currentStep,
    setCurrentStep,
    canProceedToNextStep,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
  } = useCharacterCreatorStore();

  const handleClassSelection = (selectedClassId: number) => {
    const selectedClass = classes.find(
      (c: CharacterClass) => c.id === selectedClassId
    );
    if (selectedClass) {
      useCharacterCreatorStore.getState().setSelectedClass(selectedClass);
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MainContainer>
            <RaceSelector />
            <div className="second-column">
              <div className="second-column-top">
                <img
                  src="/images/ui/charactercreation/creationviewport.png"
                  alt="Creation Viewport"
                  style={{ maxWidth: "500px" }}
                />
              </div>
              <div className="second-column-bottom">
                <NameInput />
              </div>
            </div>
            <div className="third-column">
              <ClassSelector onClassSelect={handleClassSelection} />
            </div>
            <div className="fourth-column">
              <AttributeAllocator />
            </div>
          </MainContainer>
        );
      case 2:
        return <DeitySelector />;
      case 3:
        return <ZoneSelector />;
      case 4:
        return (
          <StoryText>
            Your journey begins in the realm of Norrath, where destiny awaits.
            As a {selectedRace?.name} {selectedClass?.name}, blessed by{" "}
            {selectedDeity?.name}, you take your first steps in{" "}
            {selectedZone?.long_name}. The path ahead is filled with adventure,
            danger, and glory. Are you ready to begin?
          </StoryText>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderStep()}
      <NavigationContainer>
        {currentStep > 1 && (
          <StyledButton onClick={handleBack}>Back</StyledButton>
        )}
        {currentStep === 4 ? (
          <SubmitCharacter />
        ) : (
          <StyledButton onClick={handleNext} disabled={!canProceedToNextStep()}>
            Next
          </StyledButton>
        )}
      </NavigationContainer>
    </>
  );
};

export default CharacterCreator;
