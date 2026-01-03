import React, { useEffect } from 'react';
import styled from 'styled-components';
import useRecipeStore from '@stores/RecipeStore';

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.8);
    border-radius: 4px;
  }
`;

const RecipeItem = styled.div<{ $isSelected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin: 2px 0;
  background: ${(props) => props.$isSelected
    ? 'rgba(80, 120, 180, 0.6)'
    : 'rgba(40, 40, 40, 0.6)'};
  border: 1px solid ${(props) => props.$isSelected
    ? 'rgba(120, 160, 220, 0.8)'
    : 'rgba(60, 60, 60, 0.6)'};
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: ${(props) => props.$isSelected
    ? 'rgba(80, 120, 180, 0.8)'
    : 'rgba(60, 60, 60, 0.8)'};
  }
`;

const RecipeName = styled.span`
  color: #e0e0e0;
  font-size: 13px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SkillLevel = styled.span<{ $isLow?: boolean }>`
  color: ${(props) => props.$isLow ? '#88cc88' : '#aaaaaa'};
  font-size: 11px;
  margin-left: 10px;
  white-space: nowrap;
`;

const LoadingText = styled.p`
  color: #aaa;
  font-size: 12px;
  text-align: center;
  padding: 20px;
`;

const EmptyText = styled.p`
  color: #888;
  font-size: 12px;
  text-align: center;
  padding: 20px;
`;

interface RecipeListProps {
  playerSkillLevel?: number; // Player's current blacksmithing skill
}

const RecipeList: React.FC<RecipeListProps> = ({ playerSkillLevel = 0 }) => {
  const {
    recipes,
    loadingRecipes,
    loadRecipes,
    selectedRecipe,
    selectRecipe,
    selectedTradeskill,
  } = useRecipeStore();

  // Load recipes when component mounts - store handles deduplication
  useEffect(() => {
    loadRecipes(selectedTradeskill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTradeskill]);

  if (loadingRecipes) {
    return <LoadingText>Loading recipes...</LoadingText>;
  }

  if (recipes.length === 0) {
    return <EmptyText>No recipes available for this tradeskill</EmptyText>;
  }

  return (
    <ListContainer>
      {recipes.map((recipe) => {
        const isSelected = selectedRecipe?.id === recipe.id;
        const canAttempt = playerSkillLevel >= recipe.skillneeded;

        return (
          <RecipeItem
            key={recipe.id}
            $isSelected={isSelected}
            onClick={() => selectRecipe(recipe)}
          >
            <RecipeName>{recipe.name}</RecipeName>
            <SkillLevel $isLow={canAttempt}>
              {recipe.trivial}
            </SkillLevel>
          </RecipeItem>
        );
      })}
    </ListContainer>
  );
};

export default RecipeList;
