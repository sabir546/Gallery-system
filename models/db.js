const mongoose= require('mongoose')
.connect("mongodb://127.0.0.1:27017/login-out")
.then(()=>console.log("Db connected"))
.catch((error)=>console.log(error))
