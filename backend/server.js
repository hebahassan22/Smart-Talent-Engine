require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const rankRouter = require("./routes/rank");
const authRouter = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB not connected, running without DB:", err.message));
}

// Routes
app.use("/rank", rankRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);

app.get("/health", (req, res) => {
  res.json({ status: "Smart Talent Engine v2.0 running", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.listen(PORT, () => {
  console.log("Smart Talent Engine v2.0 running on http://localhost:" + PORT);
});