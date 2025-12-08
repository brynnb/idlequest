import { create } from "zustand";
import { DebugEvent, ConnectionState } from "../utils/webTransportClient";

const MAX_EVENTS = 200;

interface WebTransportDebugStore {
  events: DebugEvent[];
  isPanelOpen: boolean;
  isPaused: boolean;
  connectionState: ConnectionState;
  appendEvent: (event: DebugEvent) => void;
  togglePanel: () => void;
  togglePaused: () => void;
  clear: () => void;
  setConnectionState: (state: ConnectionState) => void;
}

const useWebTransportDebugStore = create<WebTransportDebugStore>()(
  (set, get) => ({
    events: [],
    isPanelOpen: true,
    isPaused: false,
    connectionState: "disconnected",

    appendEvent: (event: DebugEvent) => {
      if (get().isPaused) return;

      set((state) => ({
        events: [...state.events, event].slice(-MAX_EVENTS),
        // Update connection state if this is a state event
        connectionState:
          event.kind === "state" && event.state
            ? event.state
            : state.connectionState,
      }));
    },

    togglePanel: () => {
      set((state) => ({ isPanelOpen: !state.isPanelOpen }));
    },

    togglePaused: () => {
      set((state) => ({ isPaused: !state.isPaused }));
    },

    clear: () => {
      set({ events: [] });
    },

    setConnectionState: (connectionState: ConnectionState) => {
      set({ connectionState });
    },
  })
);

export default useWebTransportDebugStore;
