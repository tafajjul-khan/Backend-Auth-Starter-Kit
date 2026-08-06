import mongoose from "mongoose";

export const connectDB = async function (): Promise<void> {
  try {
    const mongoURI =
    process.env.MONGO_URI || "";
    await mongoose.connect(mongoURI);
    console.log("MONGODB Connected Succesfully");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
    process.exit(1);
  }
};
