const app = require("express")();
const httpServer = require("http").createServer(app);
const axios = require("axios");
//const mysql = require('mysql');
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    credentials: true
  }
  // cors: { origin: "*" },
});
const port = process.env.PORT || 3000;

var onlineUsers = [];
var chatGroupList = {};
var users = [];

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("KEY_EVENT_USER_CONNECTED", function (userId) {

    users[userId] = socket.id;
    var newUser = { ConnectionId: socket.id, Sub_ID: userId };
    onlineUsers.push(newUser);
    console.log("Connected user", users);
    console.log("onlineusers", onlineUsers);
    io.emit("onlineUsers", onlineUsers);
    socket.join(userId);
    
  });

  
  // Follow Request subscribe
socket.on("KEY_EVENT_FOLLWERS",(data)=>{
  data.Members.forEach((item) => {
    io.to(item.topicID).emit("KEY_EVENT_FOLLWERS", data);
  });
})

  // Join Single chat Subscribe
  socket.on("KEY_EVENT_JOIN_TOPICID", (userId) => {
    users[userId] = socket.id;
    var newUser = { ConnectionId: socket.id, Sub_ID: userId };
    onlineUsers.push(newUser);
    console.log("User join TOPICID ", userId);
    socket.join(userId);
    io.emit("serverlog","conectteded user",userId);
  });

  socket.on("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", (data) => {
    console.log("User Group sending msg object", data);
    console.log("User Group sending msg object", data.topicID);
    io.emit("serverlog","KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE Server before",data);
    if (data.type == "group") {
     // io.to(data.Admin_SubID).emit("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", data);
      data.Members.forEach((item) => {
        console.log("User join TOPIC users socket id", users[item.topicID]);
        io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", data);
      });
    }
    else{
      io.to(data.topicID).emit("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", data);
    }    
  });

  socket.on("KEY_EVENT_SEND_TOPIC_DASHBOARD_MESSAGE", (data) => {

   // io.emit("KEY_EVENT_SEND_TOPIC_DASHBOARD_MESSAGE", data);
    data.Members.forEach((item) => {
       console.log("User Dashbord post  object", data);
       io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_DASHBOARD_MESSAGE", data);
    });
  });

  socket.on("KEY_EVENT_SEND_TOPIC_COMMENTS_MESSAGE", (data) => {
    console.log("User Dashbord post comment  object", data);
    io.emit("KEY_EVENT_SEND_TOPIC_COMMENTS_MESSAGE", data);
    // data.Members.forEach((item) => {
    //   // io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_COMMENTS_MESSAGE ", data);
    // });
  });

  // Below code is past 
  // Modified latest Code is Above
  socket.on("KEY_EVENT_PRIVATE_MESSAGE_RECEIVED", function (message, userId) {
    console.log("User socket id", users[userId]);
    //socket.join(userId);
    console.log("User  id", userId);
    io.to(users[userId]).emit("KEY_EVENT_PRIVATE_MESSAGE_RECEIVED", message);
    SendFromUserDataToDB(message);
  });

  socket.on("KEY_EVENT_Group_CREATED", (data) => {
    console.log("User Group object", data);
    // socket.join(data.groupRoomId);
    // chatGroupList[data.roomId] = data;
    // io.to(users[data.masterId]).emit("chatGroupList", data);
    //io.to(data.topicID).emit("KEY_EVENT_Group_CREATED", data);  
      // data.member.forEach((item) => {
    //   io.to(users[item.Sub_ID]).emit("chatGroupList", data);
    //   io.to(users[item.Sub_ID]).emit("KEY_EVENT_Group_CREATED", data);
    // });
    data.Members.forEach((item) => {
      // io.to(item.topicID).emit("chatGroupList", data);     
      io.to(item.topicID).emit("KEY_EVENT_Group_CREATED", data);
    });
  });

  socket.on("KEY_EVENT_SEND_GROUP_MESSAGE", (data) => {
    socket.to(data.roomId).emit("KEY_EVENT_SEND_GROUP_MESSAGE", data);
  });

  // Join group chat
  //socket.on("KEY_EVENT_JOIN_GROUP", (data) => {
    // socket.join(data.roomId);
    // io.to(data.roomId).emit("KEY_EVENT_JOIN_GROUP", {
    //   roomId: data.roomId,
    //   msg: data.userName + "Joined the group chat",
    //   system: true,
    // });
   // io.to(data.topicID).emit("KEY_EVENT_JOIN_GROUP",data);
  //});

  // Post Data to Dashbord
  socket.on("KEY_EVENT_POST", (data) => {
    io.emit("KEY_EVENT_POST", data);
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

  // OLD CODE IS DOWN FOR REFERENCE

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
    SendFromUserDataToDB(message);
  });

  socket.on("sendMsgGroup", (data) => {
    socket.to(data.roomId).emit("receiveMsgGroup", data);
  });

  socket.on("createChatGroup", (data) => {
    socket.join(data.roomId);
    chatGroupList[data.roomId] = data;
    io.to(data.masterId).emit("chatGroupList", data);
    data.member.forEach((item) => {
      io.to(item.id).emit("chatGroupList", data);
      io.to(item.id).emit("createChatGroup", data);
    });
  });

  // Join group chat
  socket.on("joinChatGroup", (data) => {
    socket.join(data.info.roomId);
    io.to(data.info.roomId).emit("chatGrSystemNotice", {
      roomId: data.info.roomId,
      msg: data.userName + "Joined the group chat",
      system: true,
    });
  });

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
    var group = { GroupID: Room.GroupName + Room.Admin_SubID };
    io.emit("create group", group);
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
    io.in(groupmessage.GroupID).emit("group message", groupmessage);
  });
});

function SendFromUserDataToDB(messagedata) {
  console.log("data:", messagedata);
  const data = {
    RoomId: messagedata.RoomId,
    From_UserID: messagedata.sender,
    From_UserName: messagedata.sender_Username,
    To_UserID: messagedata.receiver,
    To_UserName: messagedata.receiver_Username,
    From_Msg: messagedata.text,
    To_Msg: "",
    Direction: 2,
  };

  axios
    .post("http://localhost:5678/UploadSentPrivateMessage", data)
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log("Body: ", res.data);
      // SendToUserDataToDB(messagedata);
    })
    .catch((err) => {
      console.error(err);
    });
}

httpServer.listen(port, () => console.log(`listening on port ${port}`));
