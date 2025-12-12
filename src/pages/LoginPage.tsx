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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  padding: 100px 120px;
  box-sizing: border-box;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: flex-start;
  margin-top: 365px;

  .selection-button {
    width: 460px;
  }
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const Logo = styled.img`
  max-width: 500px;
  height: auto;
`;

const CredentialsPanel = styled.div`
  background-image: url("/images/ui/login/logincredentialsbackground.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 500px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  box-sizing: border-box;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 20px;
`;

const InputLabel = styled.label`
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  color: #886934;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  width: 100%;
  text-align: center;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #d4c4a8;
  outline: none;
  box-sizing: border-box;

  &:focus {
    box-shadow: none;
  }

  &::placeholder {
    color: #8b7355;
  }
`;

const StatusText = styled.p`
  font-family: "Times New Roman", Times, serif;
  font-size: 18px;
  color: #d4c4a8;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  margin-top: 10px;
`;

const OfflineText = styled(StatusText)`
  color: #ff6b6b;
  text-align: center;
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const { setCharacters, setIsLoading } = useCharacterSelectStore();

  // Check if already connected
  useEffect(() => {
    if (WorldSocket.isConnected) {
      setIsConnected(true);
    }
  }, []);

  const checkServerHealth = async (opts: { silent?: boolean } = {}) => {
    const silent = opts.silent ?? false;
    if (!silent) {
      setServerStatus("checking");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    try {
      const res = await fetch("/api/hash", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      setServerStatus(res.ok ? "online" : "offline");
    } catch {
      setServerStatus("offline");
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(() => {
      // Only do a silent check to avoid UI flicker during polling.
      // We still want the UI to transition online/offline quickly.
      void checkServerHealth({ silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    if (serverStatus !== "online") {
      setError("Server is offline");
      return;
    }
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

  const handleConnect = () => {
    // TODO: Implement real authentication
  };

  const handleCancel = () => {
    // TODO: Implement cancel behavior
  };

  return (
    <Wrapper>
      {/* Left Column - Buttons */}
      <LeftColumn>
        <SelectionButton
          onClick={handleConnect}
          $isSelected={false}
          $isDisabled={false}
        >
          CONNECT
        </SelectionButton>
        <SelectionButton
          onClick={handleLogin}
          $isSelected={false}
          $isDisabled={serverStatus !== "online"}
          disabled={serverStatus !== "online"}
        >
          GUEST
        </SelectionButton>
        <SelectionButton
          onClick={handleCancel}
          $isSelected={false}
          $isDisabled={false}
        >
          CANCEL
        </SelectionButton>

        {/* Status messages below buttons */}
        {serverStatus === "offline" && (
          <OfflineText>Server is offline</OfflineText>
        )}
        {serverStatus === "checking" && (
          <StatusText>Checking server...</StatusText>
        )}
        {isConnecting && (
          <StatusText>
            {isConnected ? "Authenticating..." : "Connecting..."}
          </StatusText>
        )}
        {error && <OfflineText>{error}</OfflineText>}
      </LeftColumn>

      {/* Right Column - Logo and Credentials Panel */}
      <RightColumn>
        <Logo src="/images/ui/login/idlequestlogo.png" alt="IdleQuest" />
        <CredentialsPanel>
          <InputGroup>
            <InputLabel htmlFor="username">Username</InputLabel>
            <TextInput
              id="username"
              type="text"
              placeholder="Enter username"
              autoComplete="username"
            />
          </InputGroup>
          <InputGroup>
            <InputLabel htmlFor="password">Password</InputLabel>
            <TextInput
              id="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </InputGroup>
        </CredentialsPanel>
      </RightColumn>
    </Wrapper>
  );
};

export default LoginPage;
