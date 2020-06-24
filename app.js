const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 4000;
let server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const io = require("socket.io")(server);
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});
let onlinePlayers = [];
let roomcount = 1;
let searchingPlayers = [];
io.on("connection", (socket) => {
  onlinePlayers.push(socket.id);
  console.log(`new user connected to XO`);
  socket.on("searching", (data) => {
    searchingPlayers.push({ socketid: socket.id, username: data.username });
    if (searchingPlayers.length % 2 != 0) {
      socket.join(`room${roomcount}`);
    } else {
      socket.join(`room${roomcount}`);
      io.sockets.in(`room${roomcount}`).emit("game_started");
      io.in(`room${roomcount}`).clients((error, clients) => {
        if (error) throw error;
        io.sockets.connected[clients[0]].on("ingame", () => {
          io.sockets.connected[clients[0]].emit("playerX");
          io.sockets.connected[clients[0]].emit("not_your_turn");
        });
        io.sockets.connected[clients[1]].on("ingame", () => {
          io.sockets.connected[clients[1]].emit("playerO");
        });
        io.sockets.connected[clients[0]].on("turnover", (data) => {
          io.sockets.in(`room${roomcount}`).emit("playdone", data);
        });
        io.sockets.connected[clients[1]].on("turnover", (data) => {
          io.sockets.in(`room${roomcount}`).emit("playdone", data);
        });
        io.sockets.connected[clients[0]].on("turn_finish", (data) => {
          io.sockets.connected[clients[1]].emit("your_turn");
        });
        io.sockets.connected[clients[1]].on("turn_finish", (data) => {
          io.sockets.connected[clients[0]].emit("your_turn");
        });
        io.sockets.connected[clients[1]].on("winnerX", () => {
          io.sockets.in(`room${roomcount}`).emit("xWon");
        });
        io.sockets.connected[clients[1]].on("winnerO", () => {
          io.sockets.in(`room${roomcount}`).emit("OWon");
        });
        io.sockets.connected[clients[1]].on("draw", () => {
          io.sockets.in(`room${roomcount}`).emit("drw");
        });
      });

      // roomcount++;
    }
  });
  socket.on("disconnect", () => {
    onlinePlayers = onlinePlayers.filter((player) => player != socket.id);
    searchingPlayers = searchingPlayers.filter((p) => socket.id != p.socketid);
    console.log("user has disconnected");
  });
});
