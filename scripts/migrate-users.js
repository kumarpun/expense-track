// One-time migration script to add isEnabled field to existing users
// Run with: node scripts/migrate-users.js

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Read .env file manually
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const envLines = envContent.split("\n");

let MONGODB_URI = "";
for (const line of envLines) {
  if (line.startsWith("MONGODB_URI=")) {
    MONGODB_URI = line.replace("MONGODB_URI=", "").trim();
    // Remove quotes if present
    if ((MONGODB_URI.startsWith('"') && MONGODB_URI.endsWith('"')) ||
        (MONGODB_URI.startsWith("'") && MONGODB_URI.endsWith("'"))) {
      MONGODB_URI = MONGODB_URI.slice(1, -1);
    }
    break;
  }
}

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.db.collection("users").updateMany(
      { isEnabled: { $exists: false } },
      { $set: { isEnabled: true } }
    );

    console.log(`Updated ${result.modifiedCount} users with isEnabled: true`);

    await mongoose.disconnect();
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
