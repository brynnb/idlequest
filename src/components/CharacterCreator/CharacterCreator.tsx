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
import { getRaceImageUrl } from "@/utils/raceImageUtils";

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

const FourthColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const Step1NavigationContainer = styled.div`
  margin-top: auto;
  padding-bottom: 20px;
  display: flex;
  justify-content: center;
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

const ViewportContainer = styled.div`
  position: relative;
  width: 500px;
  height: 750px;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* Align images to bottom */
  overflow: hidden;
`;

const ViewportFrame = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height:750px;
  z-index: 2;
  pointer-events: none;
`;

const RaceImage = styled.img`
  position: absolute;
  z-index: 1;
  height: 750px;
`;

const ViewportColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
`;

const StyledSecondColumn = styled(ViewportColumn)`
  grid-column: 2;
`;

const StyledSecondColumnBottom = styled.div`
  margin-top: 20px;
`;

const StyledThirdColumn = styled.div`
  grid-column: 3;
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
  // Default to 'm' for now until gender selection is added to store
  const selectedGender: "m" | "f" = "m";

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

  const getRaceImageUrlHelper = () => {
    if (!selectedRace) return "";
    return getRaceImageUrl(selectedRace.name, selectedGender);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MainContainer>
            <RaceSelector />
            <StyledSecondColumn>
              <ViewportContainer>
                {selectedRace && (
                  <RaceImage src={getRaceImageUrlHelper()} alt={selectedRace.name} />
                )}
                <ViewportFrame
                  src="/images/ui/charactercreation/creationviewporttransparent.png"
                  alt="Creation Viewport"
                />
              </ViewportContainer>
              <StyledSecondColumnBottom>
                <NameInput />
              </StyledSecondColumnBottom>
            </StyledSecondColumn>
            <StyledThirdColumn>
              <ClassSelector onClassSelect={handleClassSelection} />
            </StyledThirdColumn>
            <FourthColumn className="fourth-column">
              <AttributeAllocator />
              <Step1NavigationContainer>
                <SelectionButton
                  onClick={handleBackToCharacterSelect}
                  $isSelected={false}
                  $width="115px"
                >
                  Back
                </SelectionButton>
                <SelectionButton
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  $isSelected={false}
                  $isDisabled={!canProceedToNextStep()}
                  $width="115px"
                >
                  Next
                </SelectionButton>
              </Step1NavigationContainer>
            </FourthColumn>
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
      {currentStep !== 1 && (
        <NavigationContainer>
          <SelectionButton onClick={handleBack} $isSelected={false}>
            Back
          </SelectionButton>
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
      )}
    </Wrapper>
  );
};

export default CharacterCreator;
