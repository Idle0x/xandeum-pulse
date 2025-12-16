async function testConnection() {
  const url = "http://173.212.203.145:6000/rpc";
  
  console.log("🔵 Connecting to Xandeum Node...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "get-pods-with-stats" 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ SUCCESS! Data received:");
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + "..."); // Show first 500 chars

  } catch (error) {
    console.log("❌ CONNECTION FAILED:");
    console.error(error.message);
  }
}

testConnection();
