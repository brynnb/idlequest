import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    teal: any;
    DICE: any;
    THREE: any;
    CANNON: any;
  }
}

function DiceRoller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);

  useEffect(() => {
    console.log('DiceRoller useEffect triggered');
    console.log('Initial refs state:', {
      containerRef: containerRef.current,
      diceBoxRef: diceBoxRef.current,
      scriptsLoaded: scriptsLoadedRef.current
    });

    const loadScript = (src: string): Promise<void> => {
      console.log(`Attempting to load script: ${src}`);
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          console.log(`Script ${src} already loaded, skipping`);
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
          console.log(`Script loaded successfully: ${src}`);
          resolve();
        };
        script.onerror = () => {
          console.error(`Failed to load script: ${src}`);
          reject(new Error(`Script load error: ${src}`));
        };
        document.body.appendChild(script);
        console.log(`Script element added to document: ${src}`);
      });
    };

    const initializeDice = async () => {
      console.log('Initializing dice system');
      console.log('Current window globals:', {
        THREE: !!window.THREE,
        CANNON: !!window.CANNON,
        teal: !!window.teal,
        DICE: !!window.DICE
      });

      if (scriptsLoadedRef.current) {
        console.log('Scripts already loaded, skipping initialization');
        return;
      }

      try {
        console.log('Loading scripts in sequence...');
        await loadScript('/libs/dice/three.min.js');
        console.log('THREE.js loaded, window.THREE:', !!window.THREE);
        
        await loadScript('/libs/dice/cannon.min.js');
        console.log('CANNON.js loaded, window.CANNON:', !!window.CANNON);
        
        await loadScript('/libs/dice/teal.js');
        console.log('teal.js loaded, window.teal:', !!window.teal);
        
        await loadScript('/libs/dice/dice.js');
        console.log('dice.js loaded, window.DICE:', !!window.DICE);

        scriptsLoadedRef.current = true;
        console.log('All scripts loaded successfully');

        // Wait a brief moment to ensure DICE is initialized
        console.log('Waiting for DICE initialization...');
        setTimeout(() => {
          console.log('Attempting to create dice box');
          console.log('Container ref status:', !!containerRef.current);
          console.log('DICE availability:', !!window.DICE);
          
          if (containerRef.current && window.DICE) {
            try {
              console.log('DICE object:', window.DICE);
              console.log('DICE methods:', Object.keys(window.DICE));
              diceBoxRef.current = new window.DICE.dice_box(containerRef.current);
              console.log('Dice box created successfully:', diceBoxRef.current);
            } catch (error) {
              console.error('Error creating dice box:', error);
            }
          } else {
            console.error('Failed to create dice box - missing dependencies:', {
              container: !!containerRef.current,
              DICE: !!window.DICE
            });
          }
        }, 100);
      } catch (error) {
        console.error('Error during dice initialization:', error);
      }
    };

    initializeDice();

    return () => {
      console.log('DiceRoller cleanup triggered');
      if (diceBoxRef.current) {
        console.log('Cleaning up dice box');
        // Add cleanup if needed
      }
    };
  }, []);

  const handleRoll = () => {
    console.log('Roll button clicked');
    console.log('Dice box status:', !!diceBoxRef.current);
    
    if (!diceBoxRef.current) {
      console.error('Dice box not initialized');
      return;
    }
    
    try {
      console.log('Setting dice configuration');
      diceBoxRef.current.setDice("2d6");
      console.log('Starting throw animation');
      diceBoxRef.current.start_throw();
      console.log('Throw animation started');
    } catch (error) {
      console.error('Error during dice roll:', error);
    }
  };

  return (
    <div>
      <div ref={containerRef} style={{ width: '500px', height: '300px' }} />
      <button onClick={handleRoll}>Roll Dice</button>
    </div>
  );
}

export default DiceRoller;