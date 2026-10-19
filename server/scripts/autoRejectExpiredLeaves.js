import "dotenv/config";
import dns from "dns";
import connectDB from "../config/db.js";
import { autoRejectExpiredLeaves } from "../utils/leaveAutoReject.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const run = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Checking for expired pending leave requests...");
    const count = await autoRejectExpiredLeaves();
    console.log(`Successfully auto-rejected ${count} expired leave request(s).`);
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
};

run();
