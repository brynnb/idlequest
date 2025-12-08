import { useEffect, useRef } from "react";
import styled from "styled-components";
import useWebTransportDebugStore from "../stores/WebTransportDebugStore";
import {
  webTransportClient,
  DebugEvent,
  ConnectionState,
} from "../utils/webTransportClient";

const PanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: ${(props) => (props.$isOpen ? "500px" : "auto")};
  max-height: ${(props) => (props.$isOpen ? "400px" : "auto")};
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #444;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: #0f0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #222;
  border-bottom: 1px solid #444;
  cursor: pointer;
  user-select: none;
`;

const Title = styled.span`
  font-weight: bold;
  color: #0ff;
`;

const StatusBadge = styled.span<{ $state: ConnectionState }>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  margin-left: 8px;
  background: ${(props) => {
    switch (props.$state) {
      case "connected":
        return "#0a0";
      case "connecting":
        return "#aa0";
      case "error":
        return "#a00";
      default:
        return "#555";
    }
  }};
  color: #fff;
`;

const Controls = styled.div`
  display: flex;
  gap: 6px;
`;

const Button = styled.button<{ $active?: boolean }>`
  background: ${(props) => (props.$active ? "#555" : "#333")};
  border: 1px solid #555;
  color: #fff;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;

  &:hover {
    background: #444;
  }
`;

const EventList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  max-height: 340px;
`;

const EventItem = styled.div<{ $kind: string }>`
  padding: 3px 0;
  border-bottom: 1px solid #333;
  word-break: break-all;

  &:last-child {
    border-bottom: none;
  }

  .timestamp {
    color: #888;
    margin-right: 6px;
  }

  .kind {
    font-weight: bold;
    margin-right: 6px;
    color: ${(props) => {
      switch (props.$kind) {
        case "send":
          return "#ff0";
        case "receive":
          return "#0f0";
        case "state":
          return "#0ff";
        default:
          return "#fff";
      }
    }};
  }

  .message {
    color: #ccc;
  }

  .state {
    color: #f0f;
  }

  .error {
    color: #f00;
  }
`;

const ToggleButton = styled.button`
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #444;
  color: #0ff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  font-size: 11px;
  z-index: 9999;

  &:hover {
    background: #333;
  }
`;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMessage(message: unknown): string {
  if (typeof message === "object" && message !== null) {
    try {
      return JSON.stringify(message, null, 0);
    } catch {
      return String(message);
    }
  }
  return String(message);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function EventRow({ event }: { event: DebugEvent }) {
  const kindLabel = event.kind.toUpperCase();

  let content: React.ReactNode;
  if (event.kind === "state") {
    content = (
      <>
        <span className="state">{event.state}</span>
        {event.error && <span className="error"> - {event.error}</span>}
      </>
    );
  } else {
    content = (
      <span className="message" title={formatMessage(event.message)}>
        {truncate(formatMessage(event.message), 200)}
      </span>
    );
  }

  return (
    <EventItem $kind={event.kind}>
      <span className="timestamp">{formatTime(event.timestamp)}</span>
      <span className="kind">[{kindLabel}]</span>
      {content}
    </EventItem>
  );
}

export default function WebTransportDebugPanel() {
  const {
    events,
    isPanelOpen,
    isPaused,
    connectionState,
    appendEvent,
    togglePanel,
    togglePaused,
    clear,
  } = useWebTransportDebugStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Subscribe to debug events from webTransportClient
  useEffect(() => {
    const unsubscribe = webTransportClient.onDebug((event) => {
      appendEvent(event);
    });

    // Set initial connection state
    useWebTransportDebugStore
      .getState()
      .setConnectionState(webTransportClient.getConnectionState());

    return unsubscribe;
  }, [appendEvent]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (listRef.current && !isPaused) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events, isPaused]);

  // Show just a toggle button when panel is closed
  if (!isPanelOpen) {
    return (
      <ToggleButton onClick={togglePanel}>
        🔌 WT Debug ({connectionState})
      </ToggleButton>
    );
  }

  return (
    <PanelContainer $isOpen={isPanelOpen}>
      <Header onClick={togglePanel}>
        <div>
          <Title>WebTransport Debug</Title>
          <StatusBadge $state={connectionState}>{connectionState}</StatusBadge>
        </div>
        <Controls onClick={(e) => e.stopPropagation()}>
          <Button $active={isPaused} onClick={togglePaused}>
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </Button>
          <Button onClick={clear}>🗑 Clear</Button>
          <Button onClick={togglePanel}>✕</Button>
        </Controls>
      </Header>
      <EventList ref={listRef}>
        {events.length === 0 ? (
          <div style={{ color: "#666", padding: "10px" }}>No events yet...</div>
        ) : (
          events.map((event, idx) => <EventRow key={idx} event={event} />)
        )}
      </EventList>
    </PanelContainer>
  );
}
