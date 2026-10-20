import "dotenv/config";
import dns from "dns";
import connectDB from "../config/db.js";
import Attendance from "../models/Attendance.js";
import { istDayStart } from "../utils/time.js";
import { calculateAutoCheckOutDetails } from "../utils/attendance.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const autoClosePastAttendances = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    const today = istDayStart();
    console.log("Checking for unclosed attendance records prior to:", today.toISOString());

    const unclosed = await Attendance.find({
      date: { $lt: today },
      checkIn: { $ne: null },
      checkOut: null,
    });

    console.log(`Found ${unclosed.length} unclosed attendance record(s).`);

    for (const record of unclosed) {
      const details = calculateAutoCheckOutDetails(record.checkIn, new Date(), record.date);

      record.checkOut = details.checkOut;
      record.workingHours = details.workingHours;
      record.dayType = details.dayType;
      record.autoCheckedOut = true;

      await record.save();
      console.log(`Closed record ID ${record._id} for date ${record.date.toISOString()} (Check in: ${new Date(record.checkIn).toLocaleTimeString()}, Check out: ${details.checkOut.toLocaleTimeString()}, Hours: ${details.workingHours}, DayType: ${details.dayType})`);
    }

    console.log("Done successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
};

autoClosePastAttendances();
