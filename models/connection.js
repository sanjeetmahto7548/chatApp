const mongoose=require('mongoose');
const config=require('./config');
mongoose.connect(config.dbURI,{useNewUrlParser: true,useUnifiedTopology: true},(err)=>{
    if(err){
        console.log("error in db connection "+err)
    }
    else{
        console.log("Database connected..")
    }
})
module.exports=mongoose;