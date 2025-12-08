import { execSync, spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port that the server runs on
const PORT = 3000;

// Function to check if the port is in use and kill the process if it is
function killProcessOnPort() {
  try {
    // Find process using the port
    const findCommand =
      process.platform === "win32"
        ? `netstat -ano | findstr :${PORT} | findstr LISTENING`
        : `lsof -i :${PORT} | grep LISTEN`;

    let output;
    try {
      output = execSync(findCommand, { encoding: "utf8" });
    } catch (error) {
      // If the command fails, it likely means no process is using the port
      console.log(`No process found using port ${PORT}`);
      return;
    }

    // Extract PID from the output
    let pid;
    if (process.platform === "win32") {
      // Windows format: TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
      const match = output.match(/LISTENING\s+(\d+)/);
      pid = match ? match[1] : null;
    } else {
      // Unix format: node    1234 user   17u  IPv6 0x12345678        0t0  TCP *:3000 (LISTEN)
      const lines = output.split("\n").filter(Boolean);
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        pid = parts[1];
      }
    }

    if (pid) {
      console.log(
        `Found process with PID ${pid} using port ${PORT}. Killing it...`
      );
      const killCommand =
        process.platform === "win32"
          ? `taskkill /F /PID ${pid}`
          : `kill -9 ${pid}`;

      execSync(killCommand);
      console.log(`Process with PID ${pid} has been killed.`);

      // Give the OS a moment to release the port
      console.log("Waiting for port to be released...");
      execSync("sleep 1");
    }
  } catch (error) {
    console.error("Error killing process:", error.message);
  }
}

// Main function to start the server
function startServer() {
  console.log("Starting server...");

  // First kill any existing process using the port
  killProcessOnPort();

  // Build the project
  console.log("Building project...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
  }

  // Start the server
  console.log("Starting server process...");
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: "inherit",
    detached: false,
  });

  serverProcess.on("error", (error) => {
    console.error("Failed to start server:", error.message);
  });

  // Handle server process exit
  serverProcess.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(
        `Server process exited with code ${code} and signal ${signal}`
      );
    } else {
      console.log("Server process exited successfully");
    }
  });

  // Handle SIGINT (Ctrl+C) to gracefully shut down
  process.on("SIGINT", () => {
    console.log("Received SIGINT. Shutting down server...");
    if (!serverProcess.killed) {
      serverProcess.kill();
    }
    process.exit(0);
  });
}

// Run the start server function
startServer();
