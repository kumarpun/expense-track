// One-time migration script to trim trailing spaces from saving titles and expense reasons
// Run with: node scripts/migrate-trim-titles.js

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

    const db = mongoose.connection.db;

    // Fix saving titles - trim whitespace
    const savings = await db.collection("savings").find({}).toArray();
    let savingsFixed = 0;
    for (const saving of savings) {
      const trimmed = saving.title.trim();
      if (trimmed !== saving.title) {
        await db.collection("savings").updateOne(
          { _id: saving._id },
          { $set: { title: trimmed } }
        );
        console.log(`  Saving: "${saving.title}" -> "${trimmed}"`);
        savingsFixed++;
      }
    }
    console.log(`Trimmed ${savingsFixed} saving titles`);

    // Fix expense reasons - trim whitespace
    const expenses = await db.collection("expenses").find({}).toArray();
    let expensesFixed = 0;
    for (const expense of expenses) {
      const trimmed = (expense.reason || "").trim();
      if (trimmed !== expense.reason) {
        await db.collection("expenses").updateOne(
          { _id: expense._id },
          { $set: { reason: trimmed } }
        );
        console.log(`  Expense reason: "${expense.reason}" -> "${trimmed}"`);
        expensesFixed++;
      }
    }
    console.log(`Trimmed ${expensesFixed} expense reasons`);

    await mongoose.disconnect();
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
