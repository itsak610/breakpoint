// -------------------------------------------------------- Functions and Variables -------------------------------------------------------- //


var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var User = require("../models/user");
var LocalStrategy = require('passport-local').Strategy;
const { find } = require('../models/user');


const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = '638781291529-c7tgea5km6kgb2ganamane5bhj6bsnh1.apps.googleusercontent.com';
const CLEINT_SECRET = 'dZib3-TgRMsNiC-RvCHXkMfF';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//0414wN3S9Cvt6CgYIARAAGAQSNwF-L9IrBCb7A6VAMu5d_5u3e4zfJL-F7XQFR05ZWPZVfTM9KkU7YdycTbQKTh1PyLEqBXlMyFs';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });


let eventIsOn = true;

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}


// -------------------------------------------------------- Caching -------------------------------------------------------- //
var cache = {}
var midWare = (req, res, next) => {
    const key = req.url
    if (cache[key]) {
        res.send(cache[key])
    } else {
        res.sendResponse = res.send
        res.send = (body) => {
            cache[key] = body
            res.sendResponse(body)
        }
        next()
    }
}

// -------------------------------------------------------- Event Status Routes -------------------------------------------------------- //

// An event trigger

const eventPassword = "password";

router.get('/event-status', (req, res) => {
  if(req.user.username != 'admin') {
    res.redirect('/login');
  }
  return res.render('trigger', { title: 'Event Trigger', eventStatus: eventIsOn});
});

router.post('/event-status', (req, res) => {
  if(req.body.password != eventPassword){
    return res.render('trigger', { title: 'Event Trigger', eventStatus: eventIsOn, error: 'Whoops! Incorrect Password. Enter a valid password or else Aliens will whisk you away.'});
  }
  else{
    if(req.body.status == 'Off'){
      eventIsOn = false;
    }
    else{
      eventIsOn = true;
    }
    return res.render('trigger', { title: 'Event Trigger', eventStatus: eventIsOn});
  }
});

router.get('/over', (req, res) => {
  if(!eventIsOn){
    return res.render('over', { title: 'Event Over'});
  }
  else{
    res.redirect('/');
  }
});




// -------------------------------------------------------- Normal Routes -------------------------------------------------------- //

router.get('/', (req, res, next) => {
    return res.redirect('/home');
});

router.get('/home', (req, res, next) => {
    return res.render('home', { title: '(c)ypher' });
});

router.get('/alumni', (req, res, next) => {
    return res.render('alumni', { title: 'Alumni' });
});

router.get('/events', (req, res, next) => {
    return res.render('events', { title: 'Events' });
});

router.get('/decypher', (req, res, next) => {
    return res.render('decypher', { title: 'De(c)ypher' });
});

// Render login page
router.get('/login', (req, res, next) => {

  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else if (!req.user){
    return res.render('login', { title: 'Login' });
  }
});

// Render register page
router.get('/register', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else if (!req.user){
    return res.render('register', { title: 'Register' });
  }
});


// -------------------------------------------------------- School Routes -------------------------------------------------------- //

router.get('/school/login', (req, res, next) => {
  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});
  }
  if (req.user){
    if (req.user.username != 'admin'){
        return res.redirect('/dashboard');
    }
    else{
        return res.redirect('/admin')
    }
  }
  else{
    return res.render('school-login', { title: 'School Login' });
  }
});

router.post('/school/login', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.render('school-login', { title: 'School Login', error : err.message });
    }
    if (!user) {
      return res.render('school-login', { title: 'School Login', error : 'Wrong username/password.' });
    }
    req.logIn(user, function(err) {
        if (req.user.username!='admin'){
            if (req.user.type != 'School'){
                if (req.user.type == 'Student'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/student/login')
                }
                else if (req.user.type == 'Participant'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/participant/login')
                }
            }
            else{
                return res.redirect('/dashboard');
            }
        }
        else{
            return res.redirect('/admin');
        }
    });
    
  })(req, res, next);
});

router.get('/school/register', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else if (!req.user){
    return res.render('school-register', { title: 'School Register' });
  }
});

//REGISTER user
router.post('/school/register', function(req, res) {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if(req.body.password != req.body.passwordConfirm){
    return res.render('school-register', { title: 'School Register', error : 'The passwords dont match.', errorcode:'red' });
  }
  else{
      User.findOne({schoolemail: req.body.schoolemail}, function(err, user) {
        if(!user){
            var verifyid = makeid(64);
            User.register(new User({
            username : req.body.username,
            schoolname : req.body.schoolname,
            type : "School",
            teachername : req.body.teachername,
            teachernumber : req.body.teachernumber,
            schoolemail: req.body.schoolemail,
            verification: verifyid,
            password1: req.body.password,
            code: makeid(8),
            time: new Date(),
            }), req.body.password, function(err, user) {
                var output = 
                `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                    <head>
                        <title>Registeration Details</title>
                    </head>
                    <body style="background:transparent">
                        <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                            <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                <div style="padding:60px">
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${req.body.username}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${req.body.password}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid}">Click here to verify your account.</a></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                            </div>
                        </div>
                    </body>
                </html>
                `

                var da_mail = `${req.body.schoolemail}`

                const accessToken = oAuth2Client.getAccessToken();

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: 'clubcypher.bot@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLEINT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });
                
                var mailOptions = {
                    from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                    to: da_mail,
                    subject: "Registeration Details",
                    text: output,
                    html: output,
                };
        if (err) {
            return res.render('school-register', { title: 'School Register', error : 'The School has already been registered.', errorcode:'red' });
            }
            else
                transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                    return res.render('school-register', { title: 'School Register', error : 'School registered successfully.', errorcode:'blue' });
                else 
                    return res.render('school-register', { title: 'School Register', error : 'School registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
            });
        }
        else{
            return res.render('school-register', { title: 'School Register', error : 'The email has already been registered.', errorcode:'red' });
        }
    })
  }
});



// -------------------------------------------------------- Student Routes -------------------------------------------------------- //

router.get('/student/login', (req, res, next) => {
  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  if (req.user) {
    if (req.user.username != 'admin'){
        return res.redirect('/dashboard');
    }
    else{
        return res.redirect('/admin')
    }
  }
  else if (!req.user){
    return res.render('student-login', { title: 'Student Login' });
  }
});

router.post('/student/login', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.render('student-login', { title: 'Student Login', error : err.message });
    }
    if (!user) {
      return res.render('student-login', { title: 'Student Login', error : 'Wrong username/password.' });
    }
    req.logIn(user, function(err) {
        if (req.user.username!='admin'){
            if (req.user.type != 'Student'){
                if (req.user.type == 'School'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/school/login')
                }
                else if (req.user.type == 'Participant'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/participant/login')
                }
            }
            else{
                return res.redirect('/dashboard');
            }
        }
        else{
            return res.redirect('/admin');
        }
    });
    
  })(req, res, next);
});

router.get('/student/register', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else{
    return res.render('register-option', { title: 'Student Register' });
  }
});

router.get('/student/register/click', (req, res, next) => {
    if(!eventIsOn){
      res.render('over', {title: "Event Over"});
    }
    if (req.user) {
      return res.redirect('/dashboard');
    }
    else{
      return res.render('student-register', { title: '(c)lick Register', eventname: 'click' });
    }
});

router.get('/student/register/clipped', (req, res, next) => {
    if(!eventIsOn){
      res.render('over', {title: "Event Over"});
    }
    if (req.user) {
      return res.redirect('/dashboard');
    }
    else{
      return res.render('student-register', { title: '(C)lipped Register', eventname: 'clipped' });
    }
});

router.post('/student/register/click', function(req, res) {

  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if(req.body.password != req.body.passwordConfirm){
    return res.render('student-register', { title: 'Student Register', error : 'The passwords dont match.', errorcode:'red', eventname: 'click' });
  }
  else{
    User.findOne({ $and: [{studentemail: req.body.email}, {studentevent: 'click'}]}, function(err, user) {
        if(!user){
            var query1 = User.find({ studentevent: 'click' })
            query1.countDocuments(function (err, count) {
                var count_part = count;
                var verifyid = makeid(64);
                User.register(new User({
                    username : 'clickparticipant' + count_part,
                    schoolname : req.body.schoolname,
                    type : "Student",
                    studentname : req.body.name,
                    studentevent : 'click',
                    studentemail : req.body.email,
                    studentnumber: req.body.phonenumber,
                    verification: verifyid,
                    password1: req.body.password,
                    student: true,
                    time: new Date(),
                }), req.body.password, function(err, user) {
                    var output = 
                    `
                    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                        <head>
                            <title>Registeration Details</title>
                        </head>
                        <body style="background:transparent">
                            <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                                <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                    <div style="padding:60px">
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>clickparticipant${count_part}</b></p>
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${req.body.password}</b></p>
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid}">Click here to verify your account.</a></p>
                                        <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
                    `

                    var da_mail = `${req.body.email}`

                    const accessToken = oAuth2Client.getAccessToken();

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: 'OAuth2',
                            user: 'clubcypher.bot@gmail.com',
                            clientId: CLIENT_ID,
                            clientSecret: CLEINT_SECRET,
                            refreshToken: REFRESH_TOKEN,
                            accessToken: accessToken,
                        },
                    });
                    
                    var mailOptions = {
                        from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                        to: da_mail,
                        subject: "Registeration Details",
                        text: output,
                        html: output,
                    };
                if (err) {
                    return res.render('student-register', { title: 'Student Register', error : 'The Student has already been registered.', errorcode:'red', eventname: 'click' });
                }
                else
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully.', errorcode:'blue', eventname: 'click' });
                        }
                        else {
                            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue', eventname: 'click' });
                        }
                    });
                }
                );
            });
    }
    else{
        return res.render('student-register', { title: 'Student Register', error : 'The email is already registered.', errorcode:'red', eventname: 'click' });
    }
    })
  }

});

router.post('/student/register/clipped', function(req, res) {
    
    if(!eventIsOn){
      res.render('over', {title: "Event Over"});
    }
    if(req.body.password != req.body.passwordConfirm){
      return res.render('student-register', { title: 'Student Register', error : 'The passwords dont match.', errorcode:'red', eventname: 'clipped' });
    }
    else{
        User.findOne({ $and: [{studentemail: req.body.email}, {studentevent: 'clipped'}]}, function(err, user) {
            if(!user){
                var query1 = User.find({ studentevent: 'clipped' })
                query1.countDocuments(function (err, count) {
                    var verifyid = makeid(64);
                    var count_part = count;
                    User.register(new User({
                    username : 'clippedparticipant' + count_part,
                    schoolname : req.body.schoolname,
                    type : "Student",
                    studentname : req.body.name,
                    studentevent : 'clipped',
                    studentemail : req.body.email,
                    studentnumber: req.body.phonenumber,
                    verification: verifyid,
                    password1: req.body.password,
                    student: true,
                    time: new Date(),
                    }), req.body.password, function(err, user) {
                        var output = 
                        `
                        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                            <head>
                                <title>Registeration Details</title>
                            </head>
                            <body style="background:transparent">
                                <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                                    <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                        <div style="padding:60px">
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>clippedparticipant${count_part}</b></p>
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${req.body.password}</b></p>
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid}">Click here to verify your account.</a></p>
                                            <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                                        </div>
                                    </div>
                                </div>
                            </body>
                        </html>
                        `
            
                        var da_mail = `${req.body.email}`
            
                        const accessToken = oAuth2Client.getAccessToken();
            
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                type: 'OAuth2',
                                user: 'clubcypher.bot@gmail.com',
                                clientId: CLIENT_ID,
                                clientSecret: CLEINT_SECRET,
                                refreshToken: REFRESH_TOKEN,
                                accessToken: accessToken,
                            },
                        });
                        
                        var mailOptions = {
                            from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                            to: da_mail,
                            subject: "Registeration Details",
                            text: output,
                            html: output,
                        };
                        if (err) {
                    return res.render('student-register', { title: 'Student Register', error : 'The Student has already been registered.', errorcode:'red', eventname: 'clipped' });
                    }
                    else
                        transporter.sendMail(mailOptions, function (err, info) {
                        if(err)
                            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully.', errorcode:'blue', eventname: 'clipped' });
                        else 
                            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue', eventname: 'clipped' });
                        });
                    }
                    );
                });
            }
            else{
                return res.render('student-register', { title: 'Student Register', error : 'The passwords dont match.', errorcode:'red', eventname: 'clipped' });
            }
        })
    }
  });
  

// -------------------------------------------------------- Participant Routes -------------------------------------------------------- //


router.get('/participant/login', (req, res, next) => {
  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  if (req.user) {
        if (req.user.username != 'admin'){
            return res.redirect('/dashboard');
        }
        else{
            return res.redirect('/admin')
        }
  }
  else if (!req.user){
    return res.render('participant-login', { title: 'Participant Login' });
  }
});

router.post('/participant/login', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.render('participant-login', { title: 'Participant Login', error : err.message });
    }
    if (!user) {
      return res.render('participant-login', { title: 'Participant Login', error : 'Wrong username/password.' });
    }
    req.logIn(user, function(err) {
        if (req.user.username!='admin'){
            if (req.user.type != 'Participant'){
                if (req.user.type == 'School'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/school/login')
                }
                else if (req.user.type == 'Student'){
                    req.session.destroy();
                    req.logout();  
                    res.redirect('/student/login')
                }
            }
            else{
                return res.redirect('/dashboard');
            }
        }
        else{
            return res.redirect('/admin');
        }
    });
    
  })(req, res, next);
});

// router.get('/school/participant/register', (req, res, next) => {
//   if(!eventIsOn){
//     res.render('over', {title: "Event Over"});
//   }
//   var currentUserType = req.user.type;
//   if (!req.user) {
//     return res.redirect('/login');
//   }
//   else{
//     if(currentUserType=="School"){
//         return res.render('event-register', { title: 'Event Register' });
//     }
//     else{
//       return res.redirect('/dashboard')
//     }
//   }
// });
router.get('/school/participant/register', (req, res, next) => {
    if(!eventIsOn){
      res.render('over', {title: "Event Over"});
    }
    var currentUserType = req.user.type;
    if (!req.user) {
      return res.redirect('/login');
    }
    else{
      if(currentUserType=="School"){
        return res.redirect('/school/participant/register/crosshair');
      }
      else{
        return res.redirect('/dashboard')
      }
    }
  });
var crosshairNumber = 0;
router.get('/school/participant/register/crosshair', (req, res, next) => {
    if(!eventIsOn){
      res.render('over', {title: "Event Over"});
    }
    var currentUserType = req.user.type;
    if (!req.user) {
      return res.redirect('/login');
    }
    else{
      if(currentUserType=="School"){
        if (crosshairNumber != 32){
            return res.render('crosshair-register', { title: '(c)rosshair Register' });
        }
        else{
            return res.render('register-closed', { title: '(c)rosshair Register'});
        }
      }
      else{
        return res.redirect('/dashboard')
      }
    }
  });
// router.get('/school/participant/register/click', (req, res, next) => {
//     if(!eventIsOn){
//       res.render('over', {title: "Event Over"});
//     }
//     var currentUserType = req.user.type;
//     if (!req.user) {
//       return res.redirect('/login');
//     }
//     else{
//       if(currentUserType=="School"){
//         return res.render('click-register', { title: '(c)lick Register' });
//       }
//       else{
//         return res.redirect('/dashboard')
//       }
//     }
//   });
// router.get('/school/participant/register/clipped', (req, res, next) => {
//   if(!eventIsOn){
//     res.render('over', {title: "Event Over"});
//   }
//   var currentUserType = req.user.type;
//   if (!req.user) {
//     return res.redirect('/login');
//   }
//   else{
//     if(currentUserType=="School"){
//       return res.render('clipped-register', { title: '(c)lipped Register' });
//     }
//     else{
//       return res.redirect('/dashboard')
//     }
//   }
// });
// router.post('/school/participant/register/click', function(req, res) {
    
//     if(!eventIsOn){
//       res.render('over', {title: "Event Over"});
//     }
//     if(req.body.password != req.body.passwordConfirm){
//       return res.render('click-register', { title: '(c)lick Register', error : 'The passwords dont match.', errorcode:'red'});
//     }
//     else{
//         var query1 = User.find({ participantevent: 'click' })
//         var verifyid = makeid(64);
//         query1.countDocuments(function (err, count) {
//              var count_part = count;
//              User.register(new User({
//                 username : 'clickparticipant' + req.user.code + count_part,
//                 password1 : (req.user.code) + 'click' + count_part,
//                 schoolname : req.user.schoolname,
//                 type : "Participant",
//                 participantname : req.body.name,
//                 participantevent : 'click',
//                 participantemail : req.body.email,
//                 participantnumber: req.body.phonenumber,
//                 code : req.user.code,
//                 verification: verifyid,
//                time: new Date(),
//              }), ((req.user.code) + 'click' + count_part), function(err, user) {
//                 var output = 
//                 `
//                 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
//                 <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
//                     <head>
//                         <title>Registeration Details</title>
//                     </head>
//                     <body style="background:transparent">
//                         <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
//                             <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
//                                 <div style="padding:60px">
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${'clickparticipant' + req.user.code + count_part}</b></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + 'click' + count_part}</b></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid}">Click here to verify your account.</a></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </body>
//                 </html>
//                 `
    
//                 var da_mail = `${req.body.email}`
    
//                 const accessToken = oAuth2Client.getAccessToken();
    
//                 const transporter = nodemailer.createTransport({
//                     service: 'gmail',
//                     auth: {
//                         type: 'OAuth2',
//                         user: 'clubcypher.bot@gmail.com',
//                         clientId: CLIENT_ID,
//                         clientSecret: CLEINT_SECRET,
//                         refreshToken: REFRESH_TOKEN,
//                         accessToken: accessToken,
//                     },
//                 });
                
//                 var mailOptions = {
//                     from: '"Club Cypher" <clubcypher.bot@gmail.com>',
//                     to: da_mail,
//                     subject: "Registeration Details",
//                     text: output,
//                     html: output,
//                 };
//                  if (err) {
//                return res.render('click-register', { title: '(c)lick Register', error : 'The Student has already been registered.', errorcode:'red'});
//              }
//              else
//                  transporter.sendMail(mailOptions, function (err, info) {
//                    if(err)
//                      return res.render('click-register', { title: '(c)lick Register', error : 'Student registered successfully.', errorcode:'blue'});
//                    else 
//                      return res.render('click-register', { title: '(c)lick Register', error : 'Student registered successfully. Their credentials have been sent to their email. You can register multiple students.', errorcode:'blue'});
//                  });
//              }
//              );
//         });
//     }
//   });
//   router.post('/school/participant/register/clipped', function(req, res) {
    
//     if(!eventIsOn){
//       res.render('over', {title: "Event Over"});
//     }
//     if(req.body.password != req.body.passwordConfirm){
//         return res.render('clipped-register', { title: '(c)lipped Register', error : 'The passwords dont match.', errorcode:'red'});
//     }
//     else{
//         var query1 = User.find({ participantevent: 'clipped' })
//         var verifyid = makeid(64);
//         query1.countDocuments(function (err, count) {
//              var count_part = count;
//              User.register(new User({
//                 username : 'clippedparticipant' + req.user.code + count_part,
//                 password1 : (req.user.code) + 'clipped' + count_part,
//                 schoolname : req.user.schoolname,
//                 type : "Participant",
//                 participantname : req.body.name,
//                 participantevent : 'clipped',
//                 participantemail : req.body.email,
//                 participantnumber: req.body.phonenumber,
//                 code : req.user.code,
//                 verification: verifyid,
//                time: new Date(),
//              }), ((req.user.code) + 'clipped' + count_part), function(err, user) {
//                 var output = 
//                 `
//                 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
//                 <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
//                     <head>
//                         <title>Registeration Details</title>
//                     </head>
//                     <body style="background:transparent">
//                         <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
//                             <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
//                                 <div style="padding:60px">
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${'clippedparticipant' + req.user.code + count_part}</b></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + 'clipped' + count_part}</b></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid}">Click here to verify your account.</a></p>
//                                     <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </body>
//                 </html>
//                 `
    
//                 var da_mail = `${req.body.email}`
    
//                 const accessToken = oAuth2Client.getAccessToken();
    
//                 const transporter = nodemailer.createTransport({
//                     service: 'gmail',
//                     auth: {
//                         type: 'OAuth2',
//                         user: 'clubcypher.bot@gmail.com',
//                         clientId: CLIENT_ID,
//                         clientSecret: CLEINT_SECRET,
//                         refreshToken: REFRESH_TOKEN,
//                         accessToken: accessToken,
//                     },
//                 });
                
//                 var mailOptions = {
//                     from: '"Club Cypher" <clubcypher.bot@gmail.com>',
//                     to: da_mail,
//                     subject: "Registeration Details",
//                     text: output,
//                     html: output,
//                 };
//                  if (err) {
//                return res.render('clipped-register', { title: '(c)lipped Register', error : 'The Student has already been registered.', errorcode:'red', eventname: 'clipped' });
//              }
//              else
//                  transporter.sendMail(mailOptions, function (err, info) {
//                    if(err)
//                      return res.render('clipped-register', { title: '(c)lipped Register', error : 'Student registered successfully.', errorcode:'blue', eventname: 'clipped' });
//                    else 
//                      return res.render('clipped-register', { title: '(c)lipped Register', error : 'Student registered successfully. Their credentials have been sent to their email. You can register multiple students.', errorcode:'blue', eventname: 'clipped' });
//                  });
//              }
//              );
//         });
//     }
//   });
router.post('/school/participant/register/crosshair', function(req, res) {

      if(!eventIsOn){
        res.render('over', {title: "Event Over"});
      }
      else{
        var verifyid1 = makeid(64);
        crosshairNumber+=1;
        User.register(new User({
          username : (req.user.username) + '03' + '01',
          password1 : (req.user.code) + '03' + '01',
          schoolname : req.user.schoolname,
          type : "Participant",
          code : req.user.code,
          participantname : req.body.name1,
          participantevent : "crosshair",
          participantemail : req.body.email1,
          participantnumber: req.body.number1,
          verification: verifyid1,
          time: new Date(),
        }), ((req.user.code) + '03' + '01'), function(err, user) {
    
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '01'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '01'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid1}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email1}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
          if (err) {
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
          }
          else
              transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                  return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                else 
                  return res.render('crosshair-register', { title: '(c)crosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
              });
          }
        )
        var verifyid2 = makeid(64);
        User.register(new User({
          username : (req.user.username) + '03' + '02',
          password1 : (req.user.code) + '03' + '02',
          schoolname : req.user.schoolname,
          type : "Participant",
          code : req.user.code,
          participantname : req.body.name2,
          participantevent : "crosshair",
          participantemail : req.body.email2,
          participantnumber: req.body.number2,
          verification: verifyid2,
          time: new Date(),
        }), ((req.user.code) + '03' + '02'), function(err,user){
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '02'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '02'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid2}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email2}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
            if (err) {
                return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
              }
              else
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                    else 
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
        });
        var verifyid3 = makeid(64);
        User.register(new User({
          username : (req.user.username) + '03' + '03',
          password1 : (req.user.code) + '03' + '03',
          schoolname : req.user.schoolname,
          type : "Participant",
          code : req.user.code,
          participantname : req.body.name3,
          participantevent : "crosshair",
          participantemail : req.body.email3,
          participantnumber: req.body.number3,
          verification: verifyid3,
          time: new Date(),
        }), ((req.user.code) + '03' + '03'), function(err,user){;
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '03'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '03'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid3}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email3}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
            if (err) {
                return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
              }
              else
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                    else 
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
        });
        var verifyid4 = makeid(64);
        User.register(new User({
          username : (req.user.username) + '03' + '04',
          password1 : (req.user.code) + '03' + '04',
          schoolname : req.user.schoolname,
          type : "Participant",
          code : req.user.code,
          participantname : req.body.name4,
          participantevent : "crosshair",
          participantemail : req.body.email4,
          participantnumber: req.body.number4,
          verification: verifyid4,
          time: new Date(),
        }), ((req.user.code) + '03' + '04'), function(err,user){;
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '04'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '04'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid4}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email4}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
            if (err) {
                return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
              }
              else
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                    else 
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
        });
        var verifyid5 = makeid(64);
        User.register(new User({
          username : (req.user.username) + '03' + '05',
          password1 : (req.user.code) + '03' + '05',
          schoolname : req.user.schoolname,
          type : "Participant",
          code : req.user.code,
          participantname : req.body.name5,
          participantevent : "crosshair",
          participantemail : req.body.email5,
          participantnumber: req.body.number5,
          verification: verifyid5,
          time: new Date(),
        }), ((req.user.code) + '03' + '05'), function(err,user){;
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '05'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '05'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid5}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email5}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
            if (err) {
                return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
              }
              else
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                    else 
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
        });
        var verifyid6 = makeid(64);
        User.register(new User({
            username : (req.user.username) + '03' + '06',
            password1 : (req.user.code) + '03' + '06',
            schoolname : req.user.schoolname,
            type : "Participant",
            code : req.user.code,
            participantname : req.body.name6 + '(substitute)',
            participantevent : "crosshair",
            participantemail : req.body.email6,
            participantnumber: req.body.number6,
            verification: verifyid6,
            substitute: true,
            time: new Date(),
        }), ((req.user.code) + '03' + '06'), function(err,user){;
            var output = 
            `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                <head>
                    <title>Registeration Details</title>
                </head>
                <body style="background:transparent">
                    <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                        <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                            <div style="padding:60px">
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${(req.user.username) + '03' + '06'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${(req.user.code) + '03' + '06'}</b></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${verifyid6}">Click here to verify your account.</a></p>
                                <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
    
            var da_mail = `${req.body.email6}`
    
            const accessToken = oAuth2Client.getAccessToken();
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'clubcypher.bot@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLEINT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
            
            var mailOptions = {
                from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                to: da_mail,
                subject: "Registeration Details",
                text: output,
                html: output,
            };
    
            if (err) {
                return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'The Team has already been registered.', errorcode:'red' });
              }
              else
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.', errorcode:'blue' });
                    else 
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
                });
        });
      }
});

router.get('/school/teams', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  var currentUserType = req.user.type;
  if (!req.user) {
    return res.redirect('/login');
  }
  else{
    if(currentUserType=="School"){
      var query = { code: req.user.code }
      User.find().find(query).sort('event').exec(function(err, teams) {
        return res.render('teams', { teams: teams, eventOver: true, title: 'Your Teams' });
      });
    }
    else{
      return res.redirect('/dashboard')
    }
  }
});



// -------------------------------------------------------- Admin Routes -------------------------------------------------------- //


// Send Email to teams
router.get('/admin/email', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email', { title: 'Send Mail' });
    }
  });
router.post('/admin/email', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    User.find().find(query).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                var tempMail = mail.email
                var output = 
                `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;padding: 10px;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
        
                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
                    }
                    h3{
                        font-size:1.1em !important;
                    }
                    .right a:hover {
                        color: #185adb !important;
                    }
                    .button a:hover{
                        color: #000 !important;
                        background-color: #DA1893 !important;
                    }
                    @media (max-width:1112px){
                        .left{
                            width: 100% !important;
                            padding: 0 !important;
                            maRgin-top: 25px !important;
                            padding-bottom: 25px !important;
                        }
                        .right{
                            width: 100% !important;
                            padding: 0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            line-height: 3vw !important;
                        }
                    }    
                    @media (max-width:750px){
                        body{
                            width:90vw !important;
                        }
                        .card{
                            width: 80% !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                            line-height:20px !important;
                        }
                        h2{
                            font-size:20px !important;
                        }
                        h3{
                            font-size:15px !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                    <div class="imgContainer" style="width:fit-content;margin:0 auto;padding-bottom:30px">
                        <img src="https://static.clubcypher.club/img/decypher.png" style="height:auto;width:10vw;" alt="decypher" />
                    </div>
                    <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                        <h2 style="margin-bottom: 20px;">De(c)ypher</h2>
                    </div>
                    <div class="content" style="width:fit-content;margin:0 auto;">
                        <div class="left" style="width: fit-content;padding: 20px;margin:0 auto;">
                            <h3 style="width:fit-content;margin-bottom: 20px;margin:0 auto;padding:30px;">
                                ${req.body.content}
                            </h3>
                        </div>
                    </div>
                    <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                        <div class="endLinks" style="width: fit-content;margin:0 auto">
                            <a href="https://www.instagram.com/cypherdps/"
                                ><img src="https://static.clubcypher.club/email/instagram2x.png" style="height: auto;width: 5vw;" alt=""
                            /></a>
                            <a href="https://www.youtube.com/channel/UCSULXN5apeQSDa0sLYuwEnA"
                                ><img src="https://static.clubcypher.club/email/youtube2x.png" style="height: auto;width: 5vw;" alt=""
                            /></a>
                        </div>
                        <div class="imgContainer2" style="width: fit-content; margin:0 auto">
                            <img src="https://static.clubcypher.club/email/cypher-01.png" style="height:auto;width:20vw;margin:0 auto" alt="" />
                        </div>
                    </div>
                    </section>
                </body>
                </html>
                `
        
                var da_mail = `${tempMail}`
        
                const accessToken = oAuth2Client.getAccessToken();
        
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: 'clubcypher.bot@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLEINT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });
                
                var mailOptions = {
                    from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                    to: da_mail,
                    subject: "Registeration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email', { title: 'Send Mail', error : err});
                    }
                else
                    transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                        return res.render('admin-email', { title: 'Send Mail', error : 'Mail sent successfully.'});
                    else 
                        return res.render('admin-email', { title: 'Send Mail', error : 'Mail sent successfully.'});
                    });
            }, i * interval)
        })
    });

    return res.redirect('/admin/email');
});

router.post('/admin/email/verify', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    var query2 = { verified : false }
    var query3 = { type : 'Student' }
    var query4 = { type : 'School' }
    var query5 = { type : 'Participant' }
    var query6 = { studentemail : {$regex : '.*@gmail.com.*'}}
    var query7 = { schoolemail : {$regex : '.*@gmail.com.*'}}
    var query8 = { participantemail : {$regex : '.*@gmail.com.*'}}
    User.find().find(query1).find(query2).find(query3).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                var tempMail = mail.studentemail
                var output = 
                `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                    <head>
                        <title>Registeration Details</title>
                    </head>
                    <body style="background:transparent">
                        <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                            <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                <div style="padding:60px">
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${mail.username}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${mail.password1}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${mail.verification}">Click here to verify your account.</a></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
                `
                var da_mail = `${tempMail}`
        
                var accessToken = oAuth2Client.getAccessToken();
        
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: 'clubcypher.bot@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLEINT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });
                
                var mailOptions = {
                    from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                    to: da_mail,
                    subject: "Registeration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email', { title: 'Send Mail', error : err});
                    }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                    if(err){
                        console.log(err)
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    }
                    else 
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    });
                }
            }, i * interval)
        });  
    });
    
    User.find().find(query1).find(query2).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                var tempMail = mail.schoolemail
                var output = 
                `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                    <head>
                        <title>Registeration Details</title>
                    </head>
                    <body style="background:transparent">
                        <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                            <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                <div style="padding:60px">
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${mail.username}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${mail.password1}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${mail.verification}">Click here to verify your account.</a></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
                `
        
                var da_mail = `${tempMail}`
        
                var accessToken = oAuth2Client.getAccessToken();
        
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: 'clubcypher.bot@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLEINT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });
                
                var mailOptions = {
                    from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                    to: da_mail,
                    subject: "Registeration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email', { title: 'Send Mail', error : err});
                    }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                    if(err){
                        console.log(err)
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    }
                    else 
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    });
                }
            }, i * interval)
        });
    });
    User.find().find(query1).find(query2).find(query5).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                var tempMail = mail.participantemail
                var output = 
                `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns=3D"https://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-micros=oft-com:vml">
                    <head>
                        <title>Registeration Details</title>
                    </head>
                    <body style="background:transparent">
                        <div style="display:flex;align-items:center;justify-content:center;font-size:3vw;">
                            <div style="align-items:center;justify-content:center;width:fit-content;height:max-content;background:#050B18;border-radius:10px">
                                <div style="padding:60px">
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:25px;color:#eee;">Thank you for registering for (c)ync!</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Here are your credentials -</p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;color:#eee;">Username: <b>${mail.username}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:5px;color:#eee;">Password: <b>${mail.password1}</b></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;"><a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/verify/${mail.verification}">Click here to verify your account.</a></p>
                                    <p style="font-family: Arial, Helvetica, sans-serif;padding-top:15px;padding-bottom:25px;color:#eee;">You can use these credentials to login <a style="text-decoration:none;color:red;" href="https://www.clubcypher.club/login">HERE</a>.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
                `
        
                var da_mail = `${tempMail}`
        
                var accessToken = oAuth2Client.getAccessToken();
        
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: 'clubcypher.bot@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLEINT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });
                
                var mailOptions = {
                    from: '"Club Cypher" <clubcypher.bot@gmail.com>',
                    to: da_mail,
                    subject: "Registeration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email', { title: 'Send Mail', error : err});
                    }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                    if(err){
                        console.log(err)
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    }
                    else 
                        return res.render('admin-email', { title: 'Send Mail', error : 'Verification mail sent successfully.'});
                    });
                }
            }, i * interval)
        });
    }); 
    return res.redirect('/admin/email');
});


// Admin Panel Route
router.get('/admin', (req, res) => {
    if (req.user){
        if(req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            return res.render('admin', { title: 'Admin Panel' });
        }
    }
    else {
        res.redirect('/login')
    }
});

//Render manage teams page
router.get('/admin/schools', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { type: 'School' }
            User.find().find(query1).exec(function(err, teams1) {
                return res.render('admin-teams', { teams: teams1, eventOver: true, title: 'View Schools' });
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/schools/:id', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query2 = { type: 'Participant' }
            var query3 = { code: req.params.id }
            User.find().find(query2).find(query3).exec(function(err, teams3) {
                if(teams3.length==0){
                    return res.render('error')
                }
                else{
                    return res.render('admin-participants', { teams: teams3, eventOver: true, title: 'View Participants' });
                }
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/schools/:id/details', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query2 = { type: 'School' }
            var query3 = { code: req.params.id }
            User.find().find(query2).find(query3).exec(function(err, teams3) {
                if(teams3.length==0){
                    return res.render('error')
                }
                else{
                    return res.render('admin-school', { teams: teams3, eventOver: true, title: 'School Details' });
                }
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/events', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            return res.render('admin-view-events', {title: 'View Events' });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/events/:event/teams', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { $or: [
                { type: 'Participant'},
                { type: 'Student'}
             ]}
            var query2 = { $or: [
                { participantevent: req.params.event},
                { studentevent: req.params.event}
             ]}
            User.find().find(query1).find(query2).sort('schoolname').exec(function(err, teams1) {
                return res.render('admin-event-teams', { teams: teams1, eventOver: true, title: (req.params.event + ' Participants') });
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/participant/:id', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query2 = { type: 'Participant' }
            var query3 = { username: req.params.id }
            User.find().find(query2).find(query3).exec(function(err, teams3) {
                return res.render('admin-participant-details', { teams: teams3, eventOver: true, title: 'Participant Details' });
            });
        }
    }
    else{
        res.redirect('/login')
    }
});

router.get('/admin/student/:id', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query2 = { type: 'Student' }
            var query3 = { username: req.params.id }
            User.find().find(query2).find(query3).exec(function(err, teams3) {
                if(teams3.length==0){
                    return res.render('error')
                }
                else{
                    return res.render('admin-student-details', { teams: teams3, eventOver: true, title: 'Student Details' });
                }
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
//SET LEVEL for teams
// router.post('/admin/teams', (req, res, next) => {
//   User.findOne({username: req.body.username}, function(err, user) {
//     user.level = req.body.newLevel;
//     user.lastLevelOn = new Date();
//     user.save();
//   });
//   return res.redirect('/admin/teams');
// });

// router.get('/admin/delete', (req, res, next) => {
//   if (req.user.username != 'admin' || !req.user.username) {
//     res.redirect('/');
//   }
//   User.find().sort('username').sort('lastLevelOn').exec(function(err, teams) {
//     return res.render('delete', { teams: teams, title: 'Delete Users' });
//   });
// });

// router.post('/admin/delete', (req, res, next) => {
//   User.findOne({username: req.body.username}).remove().exec();
//   return res.redirect('/admin/delete');
// });

router.get('/dashboard', (req, res, next) => {

  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  if (req.user) {
    if (req.user.username != 'admin'){
        var query = 'hey'
        return res.render('dashboard', { query: query, title: 'Dashboard' });
    }
    else{
        return res.redirect('/admin')
    }
  }
  else{
    return res.redirect('/login')
  }
});

 // Student Team Edit

router.get('/admin/manage/teams/student', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'Student'}
    User.find().find(query).exec(function(err, teams) {
      return res.render('manage-teams', { teams: teams, title: 'Manage Teams', userType:'Student' });
    });
});
  
router.post('/admin/manage/teams/student', (req, res, next) => {
    User.findOne({username: req.body.username}, function(err, user) {
        user.schoolname = req.body.newUsername;
        user.studentname = req.body.newStudentName;
        user.studentevent = req.body.newStudentEvent;
        user.studentemail = req.body.newStudentEmail;
        user.studentnumber = req.body.newStudentNumber;
        user.save();
    });
    return res.redirect('/admin/manage/teams/student');
});

 // School Team Edit

router.get('/admin/manage/teams/school', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'School'}
    User.find().find(query).exec(function(err, teams) {
      return res.render('manage-teams', { teams: teams, title: 'Manage Teams', userType:'School' });
    });
});
  
router.post('/admin/manage/teams/school', (req, res, next) => {
    User.findOne({username: req.body.username}, function(err, user) {
      user.schoolname = req.body.newUsername;
      user.teachername = req.body.newTeacherName;
      user.schoolemail = req.body.newSchoolEmail;
      user.teachernumber = req.body.newTeacherNumber;
      user.save();
    });
    return res.redirect('/admin/manage/teams/school');
});

 // Participant Team Edit

router.get('/admin/manage/teams/participant', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'Participant'}
    User.find().find(query).exec(function(err, teams) {
      return res.render('manage-teams', { teams: teams, title: 'Manage Teams', userType:'Participant' });
    });
});
  
router.post('/admin/manage/teams/participant', (req, res, next) => {
    User.findOne({username: req.body.username}, function(err, user) {
        user.schoolname = req.body.newUsername;
        user.participantname = req.body.newParticipantName;
        user.participantevent = req.body.newParticipantEvent;
        user.participantemail = req.body.newParticipantEmail;
        user.participantnumber = req.body.newParticipantNumber;
        user.save();
    });
    return res.redirect('/admin/manage/teams/participant');
});
router.get('/admin/verified', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var sort = { type: -1 };
            User.find().sort('verified').sort(sort).exec(function(err, teams1) {
                return res.render('verify-list', { teams: teams1, eventOver: true, title: 'Verification Status' });
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/verify/:id', (req, res, next) => {
    User.findOne({verification: req.params.id}, function(err, user) {
        if(!user){
            return res.render('error')
        }
        else{
            user.verified = true;
            user.save();
            return res.render('verified')
        }
    });
});

//LOGOUT user
router.get('/logout', (req, res, next) => {
  req.session.destroy();
  req.logout();
  res.redirect('/login')
});

module.exports = router;