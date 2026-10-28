const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "1mb" }));

// Route handlers
const questionsRoutes = require("./routes/questions.routes");
const practiceRoutes = require("./routes/practice.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const materialsRoutes = require("./routes/materials.routes");

app.use("/api/questions", questionsRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/materials", materialsRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TOEFL Path API is running",
  });
});

module.exports = app;
