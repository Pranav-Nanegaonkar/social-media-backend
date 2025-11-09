import app from "./src/server.js";

const PORT = process.env.PORT || 10000;

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on port http://localhost:${PORT}`)
);
