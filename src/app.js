const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes");

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);


const app = express();

// middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or direct server-to-server)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

// test route
app.get("/", (req, res) => {
  res.send("AI Interview Backend Running 🚀");
});

// Keep API failures machine-readable. In particular, Multer otherwise sends
// an HTML error page when a CV has the wrong type or exceeds 10 MB.
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Resume file must be 10MB or smaller" });
  }
  if (error) {
    return res.status(400).json({ message: error.message || "Invalid request" });
  }
  return next();
});

module.exports = app;
