var express = require('express');
var router = express.Router();
const User=require('../models/passport')
const passport=require('passport')
const localStrategy =require('passport-local')
passport.use(new localStrategy(User.authenticate()));
const fs=require('fs')
const nodemailer=require('nodemailer')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/signup', function(req, res, next) {
  res.render('signup');
});

router.post('/signup',async function(req, res, next) {
  try { await User.register(
    {
      username: req.body.username, 
      email: req.body.email
    },
    req.body.password
  );
  res.redirect('/signin')
    
  }
   catch (error) {
    console.log('error')
    res.send(error)
  }
});


router.get('/signin', function(req, res, next) {
  res.render('signin');
});

router.post('/signin', 
  passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect: '/signin',
  }),
  function(req ,res ,next ){}
);
function isLoggedIn(req, res,next){
  if(req.isAuthenticated()){
    next();
  }
  else{
    res.redirect('/signin')
  }
}

router.get("/signout",isLoggedIn,function(req, res, next){
  req.logout(()=>{
    res.redirect('/signin');
  })
})


// router.get('/profile', isLoggedIn ,function(req, res, next) {
//   res.render('profile');
// });

router.get('/forget', function(req, res, next) {
  res.render('forget');
});

router.post('/forget', async function(req, res, next) {
try {  const  user = await User.findOne({username:req.body.username})
  if (!user) 
    return res.send("User not found! <a href='/forget'>Try Again</a>.");

  await user.setPassword(req.body.newPassword)
  await user.save();
  res.redirect('/signin')
}
 catch (error) {
  res.send(error)
}
});

router.get('/reset', isLoggedIn , function(req, res, next) {
  res.render('reset');
});


router.post('/reset',isLoggedIn, async function(req, res, next) {
  try {
    await req.user.changePassword(
      req.body.oldPassword,
      req.body.newPassword
    )
    await req.user.save()
    res.redirect('/profile')
    
  } catch (error) {
    res.send(error)
  }
});

// multer code


const upload= require('../utils/multer').single("avatar")

router.get('/profile',  async function(req, res, next) {
  try {
    const medias=await User.find()
    console.log(medias)
    res.render('profile',{data:medias})
    
  } catch (error) {
    res.send(error)
  }
});



router.get("/delete/:id", async function (req, res, next) {
  try {
      const Media = await User.findByIdAndDelete(req.params.id);
      fs.unlinkSync("./public/uploads/" + Media.avatar);
      res.redirect("/profile");
  } catch (error) {
      res.send(error);
  }
});



router.post("/uploadFile", function (req, res, next) {
  upload(req, res, async function (err) {
      if (err) throw err;
      try {
          const Media = new User({
              username: req.body.username,
              avatar: req.file.filename,
          });
          await Media.save();
          res.redirect("/profile");
      } catch (error) {
          res.send(error);
      }
  });
});

//  POST update user profile (including avatar)
 router.post("/update/:id", isLoggedIn,function (req, res, next) {
 try {
  console.log("filename",req.file.filename);
  if(req.user.avatar !== "deafult.jpg")
  {
    fs.unlinkSync('./public/uploads/'+req.user.avatar);
  }
  req.user.avatar = req.file.filename;
  req.user.save();
  res.redirect('/profile');
    
 } catch (error) {
  res.send(error)
 }
});


 router.get('/update/:id',async function(req, res, next) {
  const user =await User.findById(req.params.id) 
   res.render('update',{data:user});
});
  





//Send-mail route

router.post('/send-mail', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.send("User Not Found");
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    user.resetPasswordOtp = otp;
    await user.save();
    await sendMailhandler(req.body.email, otp, res);
    res.render('Authenticate/otpValidation.ejs', {
      email: req.body.email,
      id: user._id,
      admin: req.user,
    });
  } catch (error) {
    res.send(error);
  }
})

//sendMailHandler Function
async function sendMailhandler(email, otp, res) {
  const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: `mdgulamsabir9@gmail.com`,
      pass:"ewwvsfesrcotsafp",
    },
  });

  // receiver mailing info
  const mailOptions = {
    from: " Pvt. Ltd<mdgulamsabir9@gmail.com",
    to: email,
    subject: "OTP Testing Mail Service",
    // text: req.body.message,
    html: `<h1>${otp}</h1>`,
  };
  // actual object which intregrate all info and send mail
  transport.sendMail(mailOptions, (err, info) => {
    if (err) {
      return res.send(err)
    }
    // console.log(info);
    return;
  });
}
//OTP Check 
router.post('/Authenticate/OTP-match/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    // console.log(user);
    if (user.resetPasswordOtp == req.body.otp) {
      user.resetPasswordOtp = -1;
      await user.save();
      res.render('Authenticate/newPassword.ejs', { id: user._id });
      return;
    }
    res.send('OTP not match');
  } catch (error) {
    res.send(error);
  }
})

module.exports = router;
