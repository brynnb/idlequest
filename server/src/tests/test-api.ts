import fetch from "node-fetch";

const SERVER_URL = "http://localhost:3000";

// Define types for API responses
interface Zone {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name: string;
  file_name?: string;
  description?: string;
  // Add other zone properties as needed
}

interface NPC {
  id: number;
  name: string;
  level?: number;
  // Add other NPC properties as needed
}

// Function to test the broadcast endpoint
const testBroadcast = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "This is a test broadcast message!",
      }),
    });

    const data = await response.json();
    console.log("Broadcast response:", data);
  } catch (error) {
    console.error("Error testing broadcast:", error);
  }
};

// Function to test the combat endpoint
const testCombat = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/combat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attacker: "Player1",
        target: "Goblin",
        damage: 25,
        isCritical: true,
      }),
    });

    const data = await response.json();
    console.log("Combat response:", data);
  } catch (error) {
    console.error("Error testing combat:", error);
  }
};

// Function to test the loot endpoint
const testLoot = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/loot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        character: "Player1",
        item: "Gold Coin",
        quantity: 50,
      }),
    });

    const data = await response.json();
    console.log("Loot response:", data);
  } catch (error) {
    console.error("Error testing loot:", error);
  }
};

// Function to test the server's routes
const testServerRoutes = async () => {
  try {
    console.log("Testing available routes...");

    // Test the health endpoint
    console.log("Testing health endpoint...");
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("Health endpoint response:", healthData);
    } else {
      console.log(
        `Health endpoint failed: ${healthResponse.status} ${healthResponse.statusText}`
      );
    }

    // Try to get a list of all available routes
    console.log("\nTesting various API endpoints to check what's available:");

    const endpoints = [
      "/api",
      "/api/zones",
      "/api/characters",
      "/api/broadcast",
      "/api/combat",
      "/api/loot",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SERVER_URL}${endpoint}`);
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error: any) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error testing server routes:", error);
  }
};

// Function to test zone endpoints
const testZones = async () => {
  try {
    // Test getting all zones
    console.log("Testing GET all zones...");
    const allZonesResponse = await fetch(`${SERVER_URL}/api/zones`);

    // Check if the response is OK
    if (!allZonesResponse.ok) {
      console.log(
        `Failed to get zones: ${allZonesResponse.status} ${allZonesResponse.statusText}`
      );
      console.log(
        "This could be because the database doesn't have zone data yet."
      );
      return;
    }

    // Try to parse the response as JSON
    let allZonesData;
    try {
      allZonesData = (await allZonesResponse.json()) as Zone[];
      console.log(`Retrieved ${allZonesData.length || 0} zones`);
    } catch (error) {
      console.log(
        "Error parsing zone data. The response might not be valid JSON."
      );
      const text = await allZonesResponse.text();
      console.log(
        "Response text:",
        text.substring(0, 100) + (text.length > 100 ? "..." : "")
      );
      return;
    }

    if (allZonesData.length > 0) {
      // Get the first zone's short name to test the get-by-shortname endpoint
      const firstZone = allZonesData[0];
      console.log(
        `First zone: ${firstZone.long_name} (${firstZone.short_name})`
      );

      // Test getting a specific zone by short name
      console.log(`Testing GET zone by short name: ${firstZone.short_name}...`);
      const zoneResponse = await fetch(
        `${SERVER_URL}/api/zones/name/${firstZone.short_name}`
      );

      if (!zoneResponse.ok) {
        console.log(
          `Failed to get zone by short name: ${zoneResponse.status} ${zoneResponse.statusText}`
        );
        return;
      }

      try {
        const zoneData = (await zoneResponse.json()) as Zone;
        console.log("Zone data:", zoneData);
      } catch (error) {
        console.log("Error parsing zone data for specific zone.");
        return;
      }

      // Test getting NPCs in a zone
      console.log(`Testing GET NPCs in zone: ${firstZone.short_name}...`);
      const npcsResponse = await fetch(
        `${SERVER_URL}/api/zones/${firstZone.short_name}/npcs`
      );

      if (!npcsResponse.ok) {
        console.log(
          `Failed to get NPCs: ${npcsResponse.status} ${npcsResponse.statusText}`
        );
        return;
      }

      try {
        const npcsData = (await npcsResponse.json()) as NPC[];
        console.log(
          `Retrieved ${npcsData.length || 0} NPCs in zone ${
            firstZone.short_name
          }`
        );

        // List the first 10 NPCs
        if (npcsData.length > 0) {
          console.log("First 10 NPCs in this zone:");
          const npcsToShow = npcsData.slice(0, 10);
          npcsToShow.forEach((npc, index) => {
            console.log(
              `${index + 1}. ${npc.name}${
                npc.level ? ` (Level ${npc.level})` : ""
              }`
            );
          });

          // Log the structure of the first NPC to help debug
          console.log(
            "\nFirst NPC data structure:",
            JSON.stringify(npcsData[0], null, 2)
          );
        } else {
          console.log("No NPCs found in this zone.");
        }
      } catch (error) {
        console.log("Error parsing NPC data.");
        return;
      }
    } else {
      console.log("No zones found in database");
    }
  } catch (error) {
    console.error("Error testing zone endpoints:", error);
  }
};

// Run all tests with a delay between them
const runTests = async () => {
  console.log("Testing broadcast endpoint...");
  await testBroadcast();

  // Wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Testing combat endpoint...");
  await testCombat();

  // Wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Testing loot endpoint...");
  await testLoot();

  // Wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Testing server routes...");
  await testServerRoutes();

  // Wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Testing zone endpoints...");
  await testZones();

  console.log("All tests completed.");
};

// Run the tests
runTests().catch(console.error);
