import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useGameScreenStore from "@stores/GameScreenStore";
import useStaticDataStore from "@stores/StaticDataStore";
import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./StartingZoneSelector";
import SubmitCharacter from "./SubmitCharacter";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

const Wrapper = styled.div`
  position: relative;
  width: 1400px;
  height: 1040px;
`;

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: 220px 500px 220px 260px;
  gap: 20px;
  height: 1040px;
  width: 1400px;
`;

const NavigationContainer = styled.div`
  position: absolute;
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

const CharacterCreator = () => {
  const { setScreen } = useGameScreenStore();
  const {
    currentStep,
    setCurrentStep,
    canProceedToNextStep,
    selectedRace,
    selectedClass,
    selectedDeity,
    selectedZone,
    resetStore,
  } = useCharacterCreatorStore();

  const classes = useStaticDataStore((state) => state.classes);

  const handleClassSelection = (selectedClassId: number) => {
    const foundClass = classes.find((c) => c.id === selectedClassId);
    if (foundClass) {
      useCharacterCreatorStore.getState().setSelectedClass(foundClass);
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

  const handleBackToCharacterSelect = () => {
    resetStore();
    setScreen("characterSelect");
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
    <Wrapper>
      {renderStep()}
      <NavigationContainer>
        {currentStep === 1 ? (
          <SelectionButton
            onClick={handleBackToCharacterSelect}
            $isSelected={false}
          >
            Back to Character Select
          </SelectionButton>
        ) : (
          <SelectionButton onClick={handleBack} $isSelected={false}>
            Back
          </SelectionButton>
        )}
        {currentStep === 4 ? (
          <SubmitCharacter />
        ) : (
          <SelectionButton
            onClick={handleNext}
            disabled={!canProceedToNextStep()}
            $isSelected={false}
            $isDisabled={!canProceedToNextStep()}
          >
            Next
          </SelectionButton>
        )}
      </NavigationContainer>
    </Wrapper>
  );
};

export default CharacterCreator;
