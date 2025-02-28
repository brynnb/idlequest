import { io, Socket } from "socket.io-client";
import { MessageType } from "./types/message.js";

// Number of clients to simulate
const NUM_CLIENTS = 10;
const SERVER_URL = "http://localhost:3001";

// Array to store client sockets
const clients: Socket[] = [];

// Function to create a client
const createClient = (index: number): Promise<Socket> => {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(`Client ${index} connected with ID: ${socket.id}`);
      resolve(socket);
    });

    socket.on("chat-message", (message) => {
      console.log(`Client ${index} received message: ${message.text}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`Client ${index} connection error:`, error);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client ${index} disconnected: ${reason}`);
    });
  });
};

// Function to simulate client activity
const simulateClientActivity = async () => {
  console.log(`Creating ${NUM_CLIENTS} test clients...`);

  // Create clients
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = await createClient(i);
    clients.push(client);

    // Add a small delay between client connections
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`All ${NUM_CLIENTS} clients connected.`);

  // Keep the connections open for a while
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Disconnect all clients
  console.log("Disconnecting all clients...");
  for (const client of clients) {
    client.disconnect();
  }

  console.log("Test completed.");
};

// Run the simulation
simulateClientActivity().catch(console.error);
