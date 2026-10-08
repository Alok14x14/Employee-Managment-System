import mongoose from "mongoose";

let cachedPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!cachedPromise) {
        mongoose.connection.on('connected', () => console.log("Database connected"));
        cachedPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
            cachedPromise = null;
            throw err;
        });
    }

    return cachedPromise;
};

export default connectDB;