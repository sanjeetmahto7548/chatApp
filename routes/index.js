const express=require('express')
const router=express.Router();
const singleUserChatModel=require('../models/Schema/singleUserChat')
const groupUserChatModel=require('../models/Schema/groupUserChat')

router.post('/singleChat',async(req,res)=>{
    try{
        console.log(req.body)
const {From_UserID,From_UserName,To_UserID,To_UserName,From_Msg,type,topicID,roomID,DateTimeStamp}=req.body
    
const singleUserChat=new singleUserChatModel({
        From_UserID,
        From_UserName,
        To_UserID,
        To_UserName,
        From_Msg,
        type,
        topicID,
        roomID,
        DateTimeStamp
    })
 const data=await singleUserChat.save();

res.status(201).json({message:"chat saved",success:true,data:data})
    }catch(err){
        console.log(err)
res.status(400).json({message:"Something went wrong",success:false,err:err.message})
    }
})

router.post('/groupChat',async(req,res)=>{
    try{
        const {text,sender,Admin_SubID,GroupName,type,sender_Username,Members}=req.body
        const groupUserChat=new groupUserChatModel({
            text,
            sender,
            Admin_SubID,
            GroupName,
            type,
            sender_Username,
            Members,
              })
        const savedGroupData=await groupUserChat.save();
        res.status(201).json({message:"chat saved",success:true,data:savedGroupData})
    }catch(err){
        res.status(400).json({message:"Something went wrong",success:false,err:err.message})
    }
    })

router.get('/chat/:id',async(req,res)=>{
    try{
const roomID=req.params.id;
const data=await singleUserChatModel.find({roomID})
res.status(201).json({message:"chat retrieved",success:true,data:data})
    }catch(err){
res.status(400).json({message:"Something went wrong",err:err.message,success:false})
    }
})


module.exports=router