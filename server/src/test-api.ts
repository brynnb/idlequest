import fetch from "node-fetch";

const SERVER_URL = "http://localhost:3001";

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

  console.log("All tests completed.");
};

// Run the tests
runTests().catch(console.error);
