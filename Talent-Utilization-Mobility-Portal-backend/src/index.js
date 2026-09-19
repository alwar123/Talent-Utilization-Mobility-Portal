require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");

const hrRoutes  = require("./routes/hr.routes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/hr", hrRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", service: "skillsphere-backend" }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── DB + Server ───────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => console.log(`🚀  Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });
