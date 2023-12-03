const mongoose=require('mongoose')
const plm= require("passport-local-mongoose")
const usermodel1= new mongoose.Schema({
   username:String,
   email:String,
   password:String,
   avatar:{
      type:String,
      default:'deafult.jpg'
   } ,
}
,
{ timestamps: true }
)

usermodel1.plugin(plm,{usernameField:"email"})
module.exports =mongoose.model( 'User',usermodel1)


