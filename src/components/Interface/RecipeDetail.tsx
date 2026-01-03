import React from 'react';
import styled from 'styled-components';
import useRecipeStore from '@stores/RecipeStore';
import ActionButton from '@components/Interface/ActionButton';

const DetailContainer = styled.div`
  background: rgba(20, 20, 20, 0.85);
  border: 1px solid rgba(80, 80, 80, 0.6);
  border-radius: 6px;
  padding: 15px;
  margin-top: 10px;
  width: 240px;
`;

const RecipeTitle = styled.h3`
  color: #e0e0e0;
  font-size: 16px;
  margin: 0 0 10px 0;
  text-align: center;
  border-bottom: 1px solid rgba(80, 80, 80, 0.6);
  padding-bottom: 8px;
`;

const SectionTitle = styled.h4`
  color: #aaa;
  font-size: 12px;
  margin: 10px 0 5px 0;
  text-transform: uppercase;
`;

const ComponentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ComponentItem = styled.li<{ $isMissing?: boolean }>`
  display: flex;
  align-items: center;
  padding: 4px 0;
  color: ${(props) => props.$isMissing ? '#ff6666' : '#88cc88'};
  font-size: 12px;
`;

const ComponentIcon = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
  object-fit: contain;
`;

const ComponentName = styled.span`
  flex: 1;
`;

const ComponentQty = styled.span`
  opacity: 0.8;
`;

const SkillInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(80, 80, 80, 0.6);
  font-size: 11px;
  color: #888;
`;

const CraftButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const LoadingText = styled.p`
  color: #888;
  font-size: 12px;
  text-align: center;
  padding: 20px;
`;

const EmptyMessage = styled.p`
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 20px;
`;

interface RecipeDetailProps {
    playerInventory?: Map<number, number>;
    playerSkillLevel?: number;
    onCraft?: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({
    playerInventory = new Map(),
    playerSkillLevel = 0,
    onCraft,
}) => {
    const { selectedRecipeDetails, loadingDetails, checkCanCraft } = useRecipeStore();

    if (loadingDetails) {
        return (
            <DetailContainer>
                <LoadingText>Loading recipe details...</LoadingText>
            </DetailContainer>
        );
    }

    if (!selectedRecipeDetails) {
        return (
            <DetailContainer>
                <EmptyMessage>Select a recipe to view details</EmptyMessage>
            </DetailContainer>
        );
    }

    const { recipe, components, outputs } = selectedRecipeDetails;
    const canCraft = checkCanCraft(components, playerInventory);
    const hasRequiredSkill = playerSkillLevel >= recipe.skillneeded;

    return (
        <DetailContainer>
            <RecipeTitle>{recipe.name}</RecipeTitle>

            <SectionTitle>Required Components</SectionTitle>
            <ComponentList>
                {components.map((comp, index) => {
                    const owned = playerInventory.get(comp.itemId) || 0;
                    const isMissing = owned < comp.quantity;

                    return (
                        <ComponentItem key={`comp-${index}`} $isMissing={isMissing}>
                            <ComponentIcon
                                src={`/icons/${comp.itemIcon}.gif`}
                                alt={comp.itemName}
                            />
                            <ComponentName>{comp.itemName}</ComponentName>
                            <ComponentQty>
                                {owned}/{comp.quantity}
                            </ComponentQty>
                        </ComponentItem>
                    );
                })}
            </ComponentList>

            <SectionTitle>Produces</SectionTitle>
            <ComponentList>
                {outputs.map((out, index) => (
                    <ComponentItem key={`out-${index}`}>
                        <ComponentIcon
                            src={`/icons/${out.itemIcon}.gif`}
                            alt={out.itemName}
                        />
                        <ComponentName>{out.itemName}</ComponentName>
                        {out.quantity > 1 && (
                            <ComponentQty>x{out.quantity}</ComponentQty>
                        )}
                    </ComponentItem>
                ))}
            </ComponentList>

            <SkillInfo>
                <span>Required: {recipe.skillneeded}</span>
                <span>Trivial: {recipe.trivial}</span>
            </SkillInfo>

            <CraftButtonContainer>
                <ActionButton
                    text="Craft"
                    onClick={onCraft || (() => { })}
                    isPressed={!canCraft || !hasRequiredSkill}
                    customCSS={`width: 100px; opacity: ${canCraft && hasRequiredSkill ? 1 : 0.5};`}
                />
            </CraftButtonContainer>
        </DetailContainer>
    );
};

export default RecipeDetail;
