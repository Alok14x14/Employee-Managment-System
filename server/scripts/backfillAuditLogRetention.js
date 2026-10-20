import "dotenv/config";
import connectDB from "../config/db.js";
import AuditLog from "../models/AuditLog.js";

const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const backfill = async () => {
  try {
    await connectDB();
    const cursor = AuditLog.find({ expiresAt: { $exists: false } }).select("_id createdAt").lean().cursor();
    let operations = [];
    let updatedCount = 0;

    for await (const log of cursor) {
      const createdAt = log.createdAt ? new Date(log.createdAt) : new Date();
      operations.push({
        updateOne: {
          filter: { _id: log._id, expiresAt: { $exists: false } },
          update: { $set: { expiresAt: new Date(createdAt.getTime() + RETENTION_MS) } },
        },
      });
      if (operations.length === 500) {
        const result = await AuditLog.bulkWrite(operations, { ordered: false });
        updatedCount += result.modifiedCount;
        operations = [];
      }
    }

    if (operations.length) {
      const result = await AuditLog.bulkWrite(operations, { ordered: false });
      updatedCount += result.modifiedCount;
    }

    console.log(`Applied one-year retention to ${updatedCount} existing audit logs.`);
  } catch (error) {
    console.error("Audit log retention backfill failed:", error);
    process.exitCode = 1;
  } finally {
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
  }
};

backfill();
