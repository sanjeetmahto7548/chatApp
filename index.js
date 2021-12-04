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
socket.on("KEY_EVENT_FOLLOWERS",(data)=>{
  io.emit("serverlog","KEY_EVENT_FOLLOWERS",data);
  data.Members.forEach((item) => {
    console.log("KEY_EVENT_FOLLOWERS",data);
    io.to(item.topicID).emit("KEY_EVENT_FOLLOWERS", data);
    io.emit("serverlog","KEY_EVENT_FOLLOWERS Members",data);
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

});


httpServer.listen(port, () => console.log(`listening on port ${port}`));
