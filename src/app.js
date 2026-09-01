const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes");



const app = express();

// middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or direct server-to-server)
    if (!origin) return callback(null, true);
    // Allow any localhost or 127.0.0.1 origin
    if (
      origin.startsWith("http://localhost:") || 
      origin.startsWith("http://127.0.0.1:") ||
      origin === "http://localhost" ||
      origin === "http://127.0.0.1"
    ) {
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

module.exports = app;