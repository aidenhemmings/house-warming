const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const { initSocket } = require("./socket");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const itemRoutes = require("./routes/items");
const guestRoutes = require("./routes/guests");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/guests", guestRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
