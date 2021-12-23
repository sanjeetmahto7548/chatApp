const mongoose=require('../connection');
const Schema=mongoose.Schema;
const singleUserChatSchema=new Schema({
    From_UserID:{
        type:String
    },
    From_UserName:{
        type:String
    },
    To_UserID:{
        type:String
    },
    To_UserName:{
        type:String
    },
    From_Msg: {
        type:String
    },
    type:{
        type:String
    },
    topicID:{
        type:String
    },
    roomID:{
        type:String
    },
    DateTimeStamp:{
        type:Number
    }
},{timestamps:true})

const singleUserChatModel=mongoose.model('singleUserChat',singleUserChatSchema)
module.exports=singleUserChatModel;