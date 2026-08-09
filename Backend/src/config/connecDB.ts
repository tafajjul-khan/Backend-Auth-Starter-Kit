import mongoose from "mongoose";
import Logger from "../utils/logger.ts";

export const connectDB = async function (): Promise<void> {
  try {
    const mongoURI =
    process.env.MONGO_URI || "";
    await mongoose.connect(mongoURI);
    Logger.info("MONGODB Connected Succesfully");
  } catch (error) {
    Logger.error(" MongoDB connection error:", error);
    process.exit(1);
  }
};
