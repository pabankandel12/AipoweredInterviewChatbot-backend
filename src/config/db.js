const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Accept the older MONGO_URI name too, while documenting MONGODB_URI as
    // the standard deployment variable.
    const databaseUrl = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!databaseUrl) {
      throw new Error("MONGODB_URI is not configured");
    }
    await mongoose.connect(databaseUrl);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
