const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./users/user')

const port = process.env.PORT || 3001;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('playerMove', (playingField, cb) => {
    const user = getUser(socket.id)

    io.to(user.room).emit('oponentMove', playingField)
  })
  
  socket.on("disconnect", () => {
    removeUser(socket.id)

    console.log("Client disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
