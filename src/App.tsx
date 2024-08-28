import React, { useState, useEffect, useRef } from 'react';
import CharacterProfile from './entities/CharacterProfile';

interface Monster {
  health: number;
  maxHealth: number;
}

function App() {
  const [monster, setMonster] = useState<Monster>({ health: 100, maxHealth: 100 });
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const loggedRef = useRef(false);
  
  // Add CharacterProfile state
  const [character, setCharacter] = useState<CharacterProfile>({
    name: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prevTick => prevTick + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRunning) return; // Exit early if the game is paused

    if (tick % 15 === 0 && tick !== 0) {
      setMonster(prevMonster => ({
        ...prevMonster,
        health: prevMonster.maxHealth
      }));
      if (!loggedRef.current) {
        console.log('Monster attacked! Health reset to full.');
        loggedRef.current = true;
      }
    } else {
      setMonster(prevMonster => {
        const newHealth = Math.max(prevMonster.health - prevMonster.maxHealth / 15, 0);
        if (!loggedRef.current) {
          console.log(`Monster health: ${newHealth.toFixed(2)}`);
          loggedRef.current = true;
        }
        return {
          ...prevMonster,
          health: newHealth
        };
      });
    }

    return () => {
      loggedRef.current = false;
    };
  }, [tick, isRunning]);

  const toggleRunning = () => setIsRunning(prev => !prev);

  // Add function to handle name change
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter(prev => ({ ...prev, name: event.target.value }));
  };

  return (
    <div>
      <div>Idle Game Running (check console for updates and controls)</div>
      <button onClick={toggleRunning}>
        {isRunning ? 'Pause' : 'Resume'}
      </button>
      
      {/* Add input for character name */}
      <div>
        <label htmlFor="characterName">Character Name: </label>
        <input
          id="characterName"
          type="text"
          value={character.name}
          onChange={handleNameChange}
          placeholder="Enter character name"
        />
      </div>
      
      {/* Display current character name */}
      <div>Current Character: {character.name || 'Unnamed'}</div>
    </div>
  );
}

export default App;