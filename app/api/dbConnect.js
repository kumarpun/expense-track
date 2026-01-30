import { connectMongoDb } from "../../lib/mongodb";

let isConnected = false;

export async function dbConnect() {
    if (!isConnected) {
        await connectMongoDb();
        isConnected = true;
        console.log("Database connection established");
    }
}