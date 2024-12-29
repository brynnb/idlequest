import { useEffect, useRef } from "react";
import styled from "styled-components";
import useChatStore, { MessageType } from "../stores/ChatStore";
import type { Scene, WebGLRenderer, Camera, Material } from "three";

interface DiceVars {
  ambient_light_color: number;
  spot_light_color: number;
  desk_color: string;
  desk_opacity: number;
}

interface DiceBox {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: Camera;
  desk: Material | null;
  clear: () => void;
  start_throw: (
    beforeCallback: () => null,
    afterCallback: (notation: DiceNotation) => void
  ) => void;
  setDice: (notation: string) => void;
}

interface DiceNotation {
  resultTotal: number;
}

type TealCopyFunction = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
) => Record<string, unknown>;

declare global {
  interface Window {
    teal: {
      copy: TealCopyFunction;
      copyto: TealCopyFunction;
    };
    DICE: {
      vars: DiceVars;
      dice_box: new (
        container: HTMLElement,
        options: { scale: number }
      ) => DiceBox;
    };
    THREE: typeof import("three");
    CANNON: typeof import("cannon-es");
  }
}

const DiceContainer = styled.div`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
  z-index: 3000;
`;

const RollButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1;
`;

function DiceRoller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<DiceBox | null>(null);
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
        try {
          await loadScript("/libs/dice/three.min.js");
          await loadScript("/libs/dice/cannon.min.js");
          await loadScript("/libs/dice/teal.js");

          window.DICE = {
            vars: {
              ambient_light_color: 0xffffff,
              spot_light_color: 0xffffff,
              desk_color: "#FFFFFF",
              desk_opacity: 0,
            },
            dice_box: null as unknown as new (
              container: HTMLElement,
              options: { scale: number }
            ) => DiceBox,
          };

          if (window.teal) {
            const copyFunction: TealCopyFunction = (target, source) =>
              Object.assign(target, source);
            window.teal.copy = copyFunction;
            window.teal.copyto = copyFunction;
          }

          await loadScript("/libs/dice/dice.js");
          scriptsLoadedRef.current = true;
        } catch (loadError) {
          console.error("Failed to load dice scripts:", loadError);
          return;
        }
      }

      if (containerRef.current && window.DICE?.dice_box) {
        try {
          const box = new window.DICE.dice_box(containerRef.current, {
            scale: 100,
          });

          diceBoxRef.current = box;

          if (diceBoxRef.current?.renderer) {
            diceBoxRef.current.renderer.setClearColor(0x000000, 0);
          }

          if (diceBoxRef.current?.desk && diceBoxRef.current?.scene) {
            diceBoxRef.current.scene.remove(diceBoxRef.current.desk);
            diceBoxRef.current.desk = null;
          }

          if (
            diceBoxRef.current?.renderer &&
            diceBoxRef.current?.scene &&
            diceBoxRef.current?.camera
          ) {
            diceBoxRef.current.renderer.render(
              diceBoxRef.current.scene,
              diceBoxRef.current.camera
            );
          }
        } catch (initError) {
          console.error("Failed to initialize dice:", initError);
        }
      }
    };

    initializeDice();

    return () => {
      if (diceBoxRef.current?.clear) {
        diceBoxRef.current.clear();
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
    if (!diceBoxRef.current) {
      console.error("Dice box not initialized");
      return;
    }

    try {
      const addMessage = useChatStore.getState().addMessage;

      if (!diceBoxRef.current.setDice || !diceBoxRef.current.start_throw) {
        throw new Error("Dice box methods not available");
      }

      diceBoxRef.current.setDice("1d20");

      diceBoxRef.current.start_throw(
        () => null,
        (notation: DiceNotation) => {
          if (notation?.resultTotal) {
            addMessage(
              `Rolled a d20: ${notation.resultTotal}`,
              MessageType.SYSTEM
            );
          }
        }
      );
    } catch (error) {
      console.error("Error during dice roll:", error);
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
