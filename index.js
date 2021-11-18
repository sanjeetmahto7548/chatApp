const app = require("express")();
const httpServer = require("http").createServer(app);
const axios = require("axios");
//const mysql = require('mysql');
const io = require("socket.io")(httpServer, {
  cors: { origin: "*" },
});
const port = process.env.PORT || 3000;

var onlineUsers = [];
var chatGroupList = {};

// var con = mysql.createConnection({
//   'host': 'a2nlmysql25plsk.secureserver.net',
//   'user': 'vishnu_mys_0327',
//   'password': '%rK94iv3',
//   'database': 'phmysql13251786372_'
// });

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("My SQL Server Connected!");
// });

io.on("connection", (socket) => {
  console.log("user connected");

  // Listen to chantMessage event sent by client and emit a chatMessage to the client
  socket.on("chat message", function (message) {
    io.emit("Serverlog", message);
    if (
      message.receiver != "" ||
      message.receiver != undefined ||
      message.receiver != null
    ) {
      io.to(message.receiver).emit("chat message", message);
    } else {
      io.emit("Serverlog", "message.receiver is not available");
    }
    console.log(message);
    //SendFromUserDataToDB(message);
  });


  socket.on('sendMsgGroup', (data) => {
    socket.to(data.roomId).emit('receiveMsgGroup', data);
})

  socket.on('createChatGroup', data => {
    socket.join(data.roomId);
    chatGroupList[data.roomId] = data;
    io.to(data.masterId).emit('chatGroupList',data);
    data.member.forEach(item => {
        io.to(item.id).emit('chatGroupList', data)
        io.to(item.id).emit('createChatGroup', data)
    });
})

// Join group chat
socket.on('joinChatGroup', data => {
  socket.join(data.info.roomId);
  io.to(data.info.roomId).emit('chatGrSystemNotice', {
      roomId: data.info.roomId,
      msg: data.userName +'Joined the group chat',
      system: true
  });
})

  // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
  socket.on("on typing", function (sender, receiver) {
    io.emit("on typing" + receiver, sender, receiver);
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
    io.emit("Serverlog", onlineUsers);
  });

  socket.on("create group", function (Room) {
    io.emit("Serverlog", Room);
    socket.join(Room.GroupName + Room.Admin_SubID);
    // io.to(Room.GroupName + Room.Sub_ID).emit(Room.UserName + "joined to" + Room.GroupName);
     var group = { GroupID: Room.GroupName + Room.Admin_SubID,};
     io.emit("create group",group);
     io.emit("Serverlog", group);
  });

  socket.on("leave group", function (Room) {
    socket.leave(Room.ID);
    io.to(Room.ID).emit(Room.UserName + "left" + Room.Name);
  });

  // socket.onq("group chat", function (message) {
  //   io.to(message.GroupID).emit(message);
  // });

  socket.on("group message", function (groupmessage) {
    io.in(groupmessage.GroupID).emit("group message" , groupmessage);
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
