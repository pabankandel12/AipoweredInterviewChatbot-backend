require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("Startup configuration error: JWT_SECRET is required.");
  process.exit(1);
}

if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.error("Startup configuration error: MONGODB_URI is required.");
  process.exit(1);
}

// connect DB
connectDB();

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
