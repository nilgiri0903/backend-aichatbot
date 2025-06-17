const express = require("express");
const cors = require("cors");
require("dotenv").config();
const messageRoutes = require("./routes/messages"); // For chat messages

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/messages", messageRoutes);

// Basic health check route
app.get("/", (req, res) => {
  res.send("AI Chatbot Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
