const express = require("express");
const app=express();
const httpServer = require("http").createServer(app);
const singleUserChatModel=require('./models/Schema/singleUserChat');
const groupUserChatModel=require('./models/Schema/groupUserChat');
//const axios = require("axios");
//const redis = require("redis");

// Create Redis Client
//const client = redis.createClient();

//const mysql = require('mysql');
app.use(express.json());
app.use(express.urlencoded({extended:false}))

const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    credentials: true,
  },
  // cors: { origin: "*" },
});
const port = process.env.PORT || 3000;

var onlineUsers = [];
var chatGroupList = {};
var users = [];


io.on("connection", (socket) => {
  console.log("user connected");

  // Follow Request subscribe
  socket.on("KEY_EVENT_FOLLOWERS", (data) => {
    io.emit("serverlog", "KEY_EVENT_FOLLOWERS", data);
    data.Members.forEach((item) => {
      console.log("KEY_EVENT_FOLLOWERS", data);
      io.to(item.topicID).emit("KEY_EVENT_FOLLOWERS", data);
      io.emit("serverlog", "KEY_EVENT_FOLLOWERS Members", data);
    });
  });

  // Join Single chat Subscribe
  socket.on("KEY_EVENT_JOIN_TOPICID", (userId) => {
    users[userId] = socket.id;
    var newUser = { ConnectionId: socket.id, Sub_ID: userId };
    onlineUsers.push(newUser);
    console.log("User join TOPICID ", userId);
    socket.join(userId);
    io.emit("onlineUsers", onlineUsers);
    io.emit("serverlog", "conectteded user", userId);
  });

  socket.on("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", async(data) => {
    console.log("User Group sending msg object", data);
    console.log("User Group sending msg object", data.topicID);
    io.emit(
      "serverlog",
      "KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE Server before",
      data
    );
    if (data.type == "group") {
      //mycode
      const groupUserChat=new groupUserChatModel({
    text:data.text,
    sender:data.sender,
    Admin_SubID:data.Admin_SubID,
    GroupName:data.GroupName,
    type:data.type,
    sender_Username:data.sender_Username,
    Members:data.Members
      })
const savedGroupData=await groupUserChat.save();
console.log("chat saved")
      // io.to(data.Admin_SubID).emit("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", data);
      data.Members.forEach((item) => {
        console.log("User join TOPIC users socket id", users[item.topicID]);
        io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_CHAT_MESSAGE", data);
      });
    } else {
      const singleUserChat=new singleUserChatModel({
        From_UserID:data.From_UserID,
        From_UserName:data.From_UserName,
        To_UserID:data.To_UserID,
        To_UserName:data.To_UserName,
        From_Msg:data.From_Msg,
        type:data.type,
        topicID:data.topicID,
        roomID:data.roomID,
        DateTimeStamp:data.DateTimeStamp
    })
   const savedData=await singleUserChat.save();
   console.log("chat saved")
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
    //    io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_COMMENTS_MESSAGE ", data);
    // });
  });

  socket.on("KEY_EVENT_SEND_TOPIC_REPLY_COMMENTS_MESSAGE", (data) => {
    console.log("User Dashbord post reply comment  object", data);
    io.emit("KEY_EVENT_SEND_TOPIC_REPLY_COMMENTS_MESSAGE", data);
    // data.Members.forEach((item) => {
    //    io.to(item.topicID).emit("KEY_EVENT_SEND_TOPIC_REPLY_COMMENTS_MESSAGE ", data);
    // });
  });


  socket.on("KEY_EVENT_SEND_TOPIC_LIKES_COUNT", (data) => {
    console.log("User Dashbord post reply comment  object", data);
    io.emit("KEY_EVENT_SEND_TOPIC_LIKES_COUNT", data);
    //socket.broadcast.emit('KEY_EVENT_SEND_TOPIC_LIKES_COUNT',data);
  });

  socket.on("KEY_EVENT_Group_CREATED", (data) => {
    console.log("User Group object", data);
    data.Members.forEach((item) => {
      // io.to(item.topicID).emit("chatGroupList", data);
      io.to(item.topicID).emit("KEY_EVENT_Group_CREATED", data);
    });
  });

  socket.on("KEY_EVENT_JOIN_SDG_CHAT", (data) => {
    socket.join(data);
    console.log("KEY_EVENT_JOIN_SDG_CHAT", data);
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



app.use('/',require('./routes/index'))

httpServer.listen(port, () => console.log(`listening on port ${port}`));
