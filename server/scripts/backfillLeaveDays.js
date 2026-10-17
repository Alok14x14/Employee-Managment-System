import "dotenv/config";
import dns from "dns";
import connectDB from "../config/db.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { loadHolidaySet } from "../utils/holidays.js";
import { countWorkingDays } from "../utils/leaveDays.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const backfill = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Fetching leave applications...");
    const leaves = await LeaveApplication.find({});
    console.log(`Found ${leaves.length} leave records.`);

    let updatedCount = 0;
    for (const leave of leaves) {
      const holidaySet = await loadHolidaySet(leave.startDate, leave.endDate);
      const days = countWorkingDays(leave.startDate, leave.endDate, holidaySet);

      if (leave.workingDays !== days) {
        await LeaveApplication.updateOne(
          { _id: leave._id },
          { $set: { workingDays: days } }
        );
        updatedCount++;
      }
    }

    console.log(`Successfully backfilled workingDays for ${updatedCount} leave records.`);
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
};

backfill();
