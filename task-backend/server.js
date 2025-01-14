const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./dbConfig");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"], 
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Create MySQL connection

app.use(cors());
app.use(express.json());

// API Endpoints
app.get("/tasks", (req, res) => {
  const query = "SELECT * FROM tasks ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/tasks", (req, res) => {
  const { name, status } = req.body;
  const query = "INSERT INTO tasks (name, status) VALUES (?, ?)";
  db.query(query, [name, status], (err, result) => {
    if (err) throw err;
    io.emit("taskAdded");
    res.json({ id: result.insertId, name, status });
  });
});

app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = "UPDATE tasks SET status = ? WHERE id = ?";
  db.query(query, [status, id], (err) => {
    if (err) throw err;
    io.emit("taskUpdated");
    res.sendStatus(200);
  });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM tasks WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) throw err;
    io.emit("taskDeleted");
    res.sendStatus(200);
  });
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});