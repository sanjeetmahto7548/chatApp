const mongoose=require('../connection');
const Schema=mongoose.Schema;
const groupUserChatSchema=new Schema({
    text:{
        type:String
    },
    sender:{
        type:String
    },
    Admin_SubID:{
        type:String
    },
    GroupName:{
        type:String
    },
    type:{
        type:String
    },
    sender_Username:{
        type:String
    },
    Members:{
        type:Array
    },

},{timestamps:true})
const groupUserChatModel=mongoose.model('groupChat',groupUserChatSchema)
module.exports=groupUserChatModel;