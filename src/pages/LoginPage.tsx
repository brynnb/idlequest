import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import SelectionButton from "@components/Interface/SelectionButton";
import {
  WorldSocket,
  OpCodes,
  JWTLogin,
  JWTResponse,
  CharacterSelect,
} from "@/net";
import { capnpToPlainObject } from "@/net/capnp-utils";
import useCharacterSelectStore from "@stores/CharacterSelectStore";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const Title = styled.h1`
  font-family: "Times New Roman", Times, serif;
  font-size: 48px;
  color: #2c2c2c;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const LoginBox = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 400px;
`;

const StatusText = styled.p`
  font-family: "Times New Roman", Times, serif;
  font-size: 18px;
  color: #666;
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCharacters, setIsLoading } = useCharacterSelectStore();

  // Check if already connected
  useEffect(() => {
    if (WorldSocket.isConnected) {
      setIsConnected(true);
    }
  }, []);

  const handleLogin = async () => {
    setIsConnecting(true);
    setError(null);
    setIsLoading(true);

    try {
      // Connect if not already connected
      if (!WorldSocket.isConnected) {
        const connected = await WorldSocket.connect("127.0.0.1", 443, () => {
          setIsConnected(false);
        });

        if (!connected) {
          throw new Error("Failed to connect to server");
        }
        setIsConnected(true);
      }

      // Register handler for JWT response
      const jwtPromise = new Promise<boolean>((resolve) => {
        WorldSocket.registerOpCodeHandler(
          OpCodes.JWTResponse,
          JWTResponse,
          (response) => {
            if (response.status > 0) {
              resolve(true);
            } else {
              console.error("Authentication failed");
              resolve(false);
            }
          }
        );
      });

      // Register handler for character list (SendCharInfo)
      WorldSocket.registerOpCodeHandler(
        OpCodes.SendCharInfo,
        CharacterSelect,
        (charSelect) => {
          const plainData = capnpToPlainObject(charSelect);
          setCharacters(plainData.characters || []);
          setIsLoading(false);
          // Navigate to character select after receiving character list
          navigate("/characterselect");
        }
      );

      // Send JWT login
      await WorldSocket.sendMessage(OpCodes.JWTLogin, JWTLogin, {
        token: "local",
      });

      // Wait for JWT response
      const authenticated = await jwtPromise;
      if (!authenticated) {
        throw new Error("Authentication failed");
      }

      // Server will send SendCharInfo after successful auth
      // Navigation happens in the handler above
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <Title>IdleQuest</Title>
      <LoginBox>
        {error && <StatusText style={{ color: "red" }}>{error}</StatusText>}
        {isConnecting ? (
          <StatusText>
            {isConnected ? "Authenticating..." : "Connecting to server..."}
          </StatusText>
        ) : (
          <>
            <StatusText>Welcome to Norrath</StatusText>
            <SelectionButton
              onClick={handleLogin}
              $isSelected={false}
              $isDisabled={false}
            >
              Enter World
            </SelectionButton>
          </>
        )}
      </LoginBox>
    </Wrapper>
  );
};

export default LoginPage;
