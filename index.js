const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  origins:'*:*',
  // cors: {
  //   origin: '*',
  //   methods: ["GET", "POST"]
  // }
});

var onlineUsers = [];
const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
  console.log('a user connected');

// Listen to chantMessage event sent by client and emit a chatMessage to the client
socket.on('chat message', function (message) {
    io.to(message.receiver).emit('chat message', message);
  });

  // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
  socket.on('on typing', function (sender, receiver) {
    io.to(receiver.id).emit('on typing', sender, receiver);
  });

  // Listen to newUser event sent by client and emit a newUser to the client with new list of online users
  socket.on('connect user', function (user) {
    var newUser = { ConnectionId: socket.id, Sub_ID: user };
	console.log("id and user name" + "-"+newUser.ConnectionId + ":" + newUser.Sub_ID)
    onlineUsers.push(newUser);
    io.to(socket.id).emit('connect user', newUser);
    io.emit('onlineUsers', onlineUsers);
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    onlineUsers.forEach(function (user, index) {
        if (user.ConnectionId === socket.id) {
          onlineUsers.splice(index, 1);
          io.emit('userIsDisconnected', socket.id);
          io.emit('onlineUsers', onlineUsers);
        }
      });
  });
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));