const app = require("express")();
const httpServer = require("http").createServer(app);
const axios = require("axios");
const io = require("socket.io")(httpServer, {
  cors:  {origin : '*'}
});
const port = process.env.PORT || 3000;

var onlineUsers = [];

io.on("connection", (socket) => {
  console.log("user connected");

  // Listen to chantMessage event sent by client and emit a chatMessage to the client
  socket.on("chat message", function (message) {
    io.to(message.receiver).emit("chat message", message);
    console.log(message);
    //SendFromUserDataToDB(message);
  });

  // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
  socket.on("on typing", function (sender, receiver) {
    io.to(receiver.id).emit("on typing", sender, receiver);
  });

  // Listen to newUser event sent by client and emit a newUser to the client with new list of online users
  socket.on("connect user", function (user) {
    var newUser = { ConnectionId: socket.id, Sub_ID: user };
    console.log(
      "id and user name" + "-" + newUser.ConnectionId + ":" + newUser.Sub_ID
    );
    onlineUsers.push(newUser);
    io.to(socket.id).emit("connect user", newUser);
    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("join-chat", function (Room) {
     socket.join(Room.ID);
    io.to(Room.ID).emit(Room.UserName + "joined to" + Room.Name);
  });

  socket.on("leave-chat", function (Room) {
     socket.leave(Room.ID);
    io.to(Room.ID).emit(Room.UserName + "left" + Room.Name);
  });


  socket.on("group message", function (groupmessage) {
    io.to(groupmessage.ID).emit("group message", message);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    onlineUsers.forEach(function (user, index) {
      if (user.ConnectionId === socket.id) {
        onlineUsers.splice(index, 1);
        io.emit("userIsDisconnected", socket.id);
        io.emit("onlineUsers", onlineUsers);
      }
    });
  });
});

function SendFromUserDataToDB(messagedata) {
  console.log("data:" + messagedata);
  const data = {
    UserID: 1,
    EndUserID: 1004,
    MessageDetails: messagedata.text,
    Direction: 1,
  };

  axios
    .post("http://lifexapp.com/api/UploadSentMessage", data)
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log("Body: ", res.data);
      SendToUserDataToDB(messagedata);
    })
    .catch((err) => {
      console.error(err);
    });
}

function SendToUserDataToDB(messagedata) {
  console.log("data:" + messagedata);
  const data = {
    UserID: 1004,
    EndUserID: 1,
    MessageDetails: messagedata.text,
    Direction: 2,
  };

  axios
    .post("http://lifexapp.com/api/UploadSentMessage", data)
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log("Body: ", res.data);
    })
    .catch((err) => {
      console.error(err);
    });
}

httpServer.listen(port, () => console.log(`listening on port ${port}`));
