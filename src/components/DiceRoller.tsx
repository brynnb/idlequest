//this component is loading external JS files in a sloppy get-it-working-now way because the dice library is someone's side project and not really meant for react-specific projects and i don't know best practices for implementing stuff that isn't in NPM etc
import { useEffect, useRef } from "react";
import styled from "styled-components";
import useChatStore, { MessageType } from "../stores/ChatStore";

declare global {
  interface Window {
    teal: any;
    DICE: any;
    THREE: any;
    CANNON: any;
  }
}

const DiceContainer = styled.div`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
`;

const RollButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1;
`;

function DiceRoller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      const existingCanvases =
        containerRef.current.getElementsByTagName("canvas");
      Array.from(existingCanvases).forEach((canvas) => canvas.remove());
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error: ${src}`));
        document.body.appendChild(script);
      });
    };

    const initializeDice = async () => {
      if (!scriptsLoadedRef.current) {
        await loadScript("/libs/dice/three.min.js");
        await loadScript("/libs/dice/cannon.min.js");
        await loadScript("/libs/dice/teal.js");
        await loadScript("/libs/dice/dice.js");
        scriptsLoadedRef.current = true;
      }

      if (containerRef.current && window.DICE) {
        try {
          window.DICE.vars = {
            ...window.DICE.vars,
            ambient_light_color: 0xFFFFFF,
            spot_light_color: 0xFFFFFF,
            desk_color: '#FFFFFF',
            desk_opacity: 0,
       
          };
          
          const originalDiceBox = window.DICE.dice_box;
          window.DICE.dice_box = function(container, options) {
            const instance = new originalDiceBox(container, options);
            
            // Remove the desk from the scene
            if (instance.desk) {
              instance.scene.remove(instance.desk);
              instance.desk = null;
            }
            
            // Set renderer to be transparent
            instance.renderer.setClearColor(0x000000, 0);
            
            // Force an initial render
            instance.renderer.render(instance.scene, instance.camera);
            
            return instance;
          };
          
          diceBoxRef.current = new window.DICE.dice_box(containerRef.current, { scale: 100 });
        } catch (error) {
          // Keep error handling but remove console.error
        }
      }
    };

    initializeDice();

    return () => {
      if (diceBoxRef.current) {
        if (typeof diceBoxRef.current.clear === "function") {
          diceBoxRef.current.clear();
        }
        diceBoxRef.current = null;
      }
      if (containerRef.current) {
        const existingCanvases =
          containerRef.current.getElementsByTagName("canvas");
        Array.from(existingCanvases).forEach((canvas) => canvas.remove());
      }
    };
  }, []);

  const handleRoll = () => {
    if (!diceBoxRef.current) return;

    try {
      const addMessage = useChatStore.getState().addMessage;

      diceBoxRef.current.setDice("d20");
      diceBoxRef.current.start_throw(
        (notation: any) => null,
        (notation: any) => {
          addMessage(`Rolled a d20: ${notation.resultTotal}`, MessageType.SYSTEM);
        }
      );
    } catch (error) {
      // Keep error handling but remove console.error
    }
  };

  return (
    <DiceContainer>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <RollButton onClick={handleRoll}>Roll Dice</RollButton>
    </DiceContainer>
  );
}

export default DiceRoller;
