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
const REFRESH_TOKEN = '1//04Cd1A1ATeztKCgYIARAAGAQSNwF-L9IrlNSYxtlcy5WY9fMtfD_Bd2vZND1OfjEWPt4Ujycq5hCsjm09cEYb9WZTWQPjcmY4XxM';

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
    return res.render('alumni', { title: 'Alumni' , alumnipage : true});
});

router.get('/events', (req, res, next) => {
    return res.render('events', { title: 'Events' });
});

router.get('/decypher', (req, res, next) => {
    return res.redirect('https://www.decypher.club/register');
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
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>(C)YNC v7.0</title>
                    </head>
                    <body style="color: #fff;width:fit-content;background-color: transparent;">
                        <style>
                        @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
    
                        * {
                            margin: 0;
                            padding: 0;
                            font-family: "Comfortaa", cursive;
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
                            .card{
                                width: 60vw !important;
                                margin:0 !important;
                            }
                            .textContainer{
                                font-size: 2vw !important;
                                padding:0 !important;
                            }
                            .endText{
                                font-size: 2.5vw !important;
                            }
                        }
                        </style>
                        <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                            <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                            </div>
                            <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                                <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                                <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                                <p style="padding:20px">Username - <b>${req.body.username}</b></p>
                                <p style="padding:20px">Password - <b>${req.body.password}</b></p>
                                <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                            </div>
                            <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid}" target="_blank">Verify Here</a>
                            </div>
                            <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                                <div class="endText" style="margin-bottom: 40px;">
                                We look forward to your active participation and co-operation to make
                                this endeavor a grand success.
                                <br /><br />
                                Thank You.
                                <br /><br />
                                Team (c)ypher, DPS Bhopal
                                </div>
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
                    subject: "Registration Details",
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
                    <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8" />
                            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <title>(C)YNC v7.0</title>
                        </head>
                        <body style="color: #fff;width:fit-content;background-color: transparent;">
                            <style>
                            @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
        
                            * {
                                margin: 0;
                                padding: 0;
                                font-family: "Comfortaa", cursive;
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
                                .card{
                                    width: 60vw !important;
                                    margin:0 !important;
                                }
                                .textContainer{
                                    font-size: 2vw !important;
                                    padding:0 !important;
                                }
                                .endText{
                                    font-size: 2.5vw !important;
                                }
                            }
                            </style>
                            <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                                <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                                    <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                                </div>
                                <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                                    <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                                    <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                                    <p style="padding:20px">Username - <b>clickparticipant${count_part}</b></p>
                                    <p style="padding:20px">Password - <b>${req.body.password}</b></p>
                                    <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                                </div>
                                <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                                    <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid}" target="_blank">Verify Here</a>
                                </div>
                                <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                                    <div class="endText" style="margin-bottom: 40px;">
                                    We look forward to your active participation and co-operation to make
                                    this endeavor a grand success.
                                    <br /><br />
                                    Thank You.
                                    <br /><br />
                                    Team (c)ypher, DPS Bhopal
                                    </div>
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
                        subject: "Registration Details",
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
                            return res.render('student-register', { isRedirect : true, title: 'Student Register', error : 'Student registered successfully.', errorcode:'blue', eventname: 'click' });
                        }
                        else {
                            return res.render('student-register', { isRedirect : true, title: 'Student Register', error : 'Student registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com . If you wish to register for other events as well, head over to the register page and register for the desired event using the same email id.', errorcode:'blue', eventname: 'click' });
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
                        <!DOCTYPE html>
                        <html lang="en">
                            <head>
                                <meta charset="UTF-8" />
                                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                <title>(C)YNC v7.0</title>
                            </head>
                            <body style="color: #fff;width:fit-content;background-color: transparent;">
                                <style>
                                @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
            
                                * {
                                    margin: 0;
                                    padding: 0;
                                    font-family: "Comfortaa", cursive;
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
                                    .card{
                                        width: 60vw !important;
                                        margin:0 !important;
                                    }
                                    .textContainer{
                                        font-size: 2vw !important;
                                        padding:0 !important;
                                    }
                                    .endText{
                                        font-size: 2.5vw !important;
                                    }
                                }
                                </style>
                                <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                                    <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                                        <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                                    </div>
                                    <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                                        <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                                        <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                                        <p style="padding:20px">Username - <b>clippedparticipant${count_part}</b></p>
                                        <p style="padding:20px">Password - <b>${req.body.password}</b></p>
                                        <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                                    </div>
                                    <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                                        <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid}" target="_blank">Verify Here</a>
                                    </div>
                                    <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                                        <div class="endText" style="margin-bottom: 40px;">
                                        We look forward to your active participation and co-operation to make
                                        this endeavor a grand success.
                                        <br /><br />
                                        Thank You.
                                        <br /><br />
                                        Team (c)ypher, DPS Bhopal
                                        </div>
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
                            subject: "Registration Details",
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
                            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully. Credentials sent to your email. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com . If you wish to register for other events as well, head over to the register page and register for the desired event using the same email id.', errorcode:'blue', eventname: 'clipped' });
                        });
                    }
                    );
                });
            }
            else{
                return res.render('student-register', { title: 'Student Register', error : 'The email is already registered.', errorcode:'red', eventname: 'clipped' });
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '01'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '01'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid1}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '02'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '02'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid2}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '03'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '03'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid3}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '04'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '04'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid4}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '05'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '05'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid5}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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
                      return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully. Credentials sent to their emails. If you are unable to find the email, check your spam folder or contact us at cypherdps@gmail.com', errorcode:'blue' });
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
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>(C)YNC v7.0</title>
                </head>
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                    <style>
                    @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");

                    * {
                        margin: 0;
                        padding: 0;
                        font-family: "Comfortaa", cursive;
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
                        .card{
                            width: 60vw !important;
                            margin:0 !important;
                        }
                        .textContainer{
                            font-size: 2vw !important;
                            padding:0 !important;
                        }
                        .endText{
                            font-size: 2.5vw !important;
                        }
                    }
                    </style>
                    <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                        <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                            <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                            <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                            <p style="padding:20px">Username - ${(req.user.username) + '03' + '06'}</p>
                            <p style="padding:20px">Password - ${(req.user.code) + '03' + '06'}</p>
                            <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                        </div>
                        <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                            <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${verifyid6}" target="_blank">Verify Here</a>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="endText" style="margin-bottom: 40px;">
                            We look forward to your active participation and co-operation to make
                            this endeavor a grand success.
                            <br /><br />
                            Thank You.
                            <br /><br />
                            Team (c)ypher, DPS Bhopal
                            </div>
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
                subject: "Registration Details",
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


// ------------------------------------------- Send Email to teams ------------------------------------------- //


// ------------------------------------- Send Email Get Routes ------------------------------------- //

router.get('/admin/email', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
        res.redirect('/');
    }
    else{
        return res.render('admin-email', { title: 'Send Mail' });
    }
});

// ---------------------------- Send Email Content ---------------------------- //

router.get('/admin/email/content', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-content', { title: 'Send Mail' });
    }
});
router.get('/admin/email/content/all', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-content-send', { title: 'Send Mail', pageType: 'all' });
    }
});
router.get('/admin/email/content/specific', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query4).sort('type').exec(function(err, mails) {
            return res.render('admin-email-content-send', { title: 'Send Mail', mails: mails, pageType: 'specific' });
        });
    }
});
router.get('/admin/email/content/specific/send/:type/:id', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        if(req.params.type == 'student'){
            var query2 = { username : req.params.id }
        }
        else if(req.params.type == 'school'){
            var query2 = { $and: [{code: req.params.id}, {type: 'School'}]}
        }
        else{
            var query2 = { $and: [{password1: req.params.id}, {type: 'Participant'}]}
        }
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
            return res.render('admin-email-content-send', { title: 'Send Mail', isList: true, mails: mails, pageType: 'specific'});
        });
    }
});
router.get('/admin/email/content/custom', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-content-send', { title: 'Send Mail', pageType: 'custom' });
    }
});
// ---------------------------- Send Email Verification ---------------------------- //

router.get('/admin/email/verification', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
        res.redirect('/');
    }
    else{
        return res.render('admin-email-verification', { title: 'Send Mail' });
    }
});
router.get('/admin/email/verification/all', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-verification-send', { title: 'Send Mail', pageType: 'all' });
    }
});
router.get('/admin/email/verification/specific', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        var query2 = { verified : false }
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
            return res.render('admin-email-verification-send', { title: 'Send Mail', mails: mails, pageType: 'specific'});
        });
    }
});
router.get('/admin/email/verification/specific/send/:type/:id', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        if(req.params.type == 'student'){
            var query2 = { username : req.params.id }
        }
        else if(req.params.type == 'school'){
            var query2 = { $and: [{code: req.params.id}, {type: 'School'}]}
        }
        else{
            var query2 = { $and: [{password1: req.params.id}, {type: 'Participant'}]}
        }
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
            return res.render('admin-email-verification-send', { title: 'Send Mail', isList: true, mails: mails, pageType: 'specific'});
        });
    }
});
router.get('/admin/email/verification/custom', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-verification-send', { title: 'Send Mail', pageType: 'custom' });
    }
});

// ---------------------------- Send Email Credentials ---------------------------- //

router.get('/admin/email/credentials', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-credentials', { title: 'Send Mail' });
    }
});
router.get('/admin/email/credentials/specific', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query4).exec(function(err, mails) {
            return res.render('admin-email-credentials-send', { title: 'Send Mail', mails: mails, pageType: 'specific'});
        });
    }
});
router.get('/admin/email/credentials/specific/send/:type/:id', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        var query = { username : { $ne: 'admin'}}
        if(req.params.type == 'student'){
            var query2 = { username : req.params.id }
        }
        else if(req.params.type == 'school'){
            var query2 = { $and: [{code: req.params.id}, {type: 'School'}]}
        }
        else{
            var query2 = { $and: [{password1: req.params.id}, {type: 'Participant'}]}
        }
        var query4 = { participantname: {$ne: '(substitute)'}}
        User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
            return res.render('admin-email-credentials-send', { title: 'Send Mail', isList: true, mails: mails, pageType: 'specific'});
        });
    }
});
router.get('/admin/email/credentials/custom', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    else{
        return res.render('admin-email-credentials-send', { title: 'Send Mail', pageType: 'custom' });
    }
});

// ------------------------------------------------------------------------------------------------- //


// ------------------------------------- Send Email Post Routes ------------------------------------ //

// ----------------------- Send Content Mail Post Routes ----------------------- //

// ----------- Send Content Mail to All Post Route ----------- //

router.post('/admin/email/content/all', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query).find(query4).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'all'});
        }
        else{
            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, pageType: 'all'});
        }
    });
});

router.post('/admin/email/content/all/send', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query1).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                }
                else{
                    var tempMail = mail.schoolemail
                }
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
                ${contentValue}
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-content-send', { title: 'Send Mail', error : err, pageType: 'all'});
                }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'all'});
                        }
                        else 
                        return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'all'});
                    });
                }
            }, i * interval)
        });  
    });
});

// ----------------------------------------------------------- //

// -------- Send Content Mail to Specific Post Route --------  //

router.post('/admin/email/content/specific', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query).find(query4).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'specific'});
        }
        else{
            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, pageType: 'specific'});
        }
    });
});

router.post('/admin/email/content/specific/send', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    if (req.body.studentType == 'Student'){
        var query4 = { username: req.body.username }
    }
    else if (req.body.studentType == 'School'){
        var query4 = { $and: [{username: req.body.username}, {type: 'School'}] }
    }
    else{
        var query4 = { $and: [{username: req.body.username}, {type: 'Participant'}] }
    }
    User.find().find(query1).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                }
                else{
                    var tempMail = mail.schoolemail
                }
                var contentValue = req.body.content
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
                ${contentValue}
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-content-send', { title: 'Send Mail', error : err, isList: true, mails: mails, pageType: 'specific'});
                }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Content mail sent successfully.', mails: mails, isList: true, pageType: 'specific'});
                        }
                        else 
                            return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Content mail sent successfully.', mails: mails, isList: true, pageType: 'specific'});
                    });
                }
            }, i * interval)
        });  
    });
});

// ----------------------------------------------------------- //

// ----- Send Content Mail with Custom Query Post Route -----  //

router.post('/admin/email/content/custom', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var contentValue = req.body.contentValue
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-content-send', { title: 'Send Mail', mails: mails, error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(fieldName).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-content-send', { title: 'Send Mail', mails: mails, error : 'No Records Found', pageType: 'custom'});
        }
        else{
            return res.render('admin-email-content-send', { title: 'Send Mail', mails: mails, error : 'Please Confirm', isList: true, mails: mails, contentValue: contentValue, value1: Value1, value2: Value2, pageType: 'custom'});
        }
    });
});
router.post('/admin/email/content/custom/send', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var contentValue = req.body.contentValue
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-content-send', { title: 'Send Mail', error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(fieldName).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                }
                else{
                    var tempMail = mail.schoolemail
                }
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
                ${contentValue}
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-content-send', { title: 'Send Mail', error : err, pageType: 'custom'});
                }
                else
                transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                    return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Mail sent successfully.', pageType: 'custom'});
                    else 
                    return res.render('admin-email-content-send', { title: 'Send Mail', error : 'Mail sent successfully.', pageType: 'custom'});
                });
            }, i * interval)
        })
    });
});

// ----------------------------------------------------------- //

// ----------------------------------------------------------------------------- //

// -------------------- Send Verification Mail Post Routes  -------------------- //

// ----------- Send Verification Mail to All Post Route ----------- //

router.post('/admin/email/verification/all', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query2 = { verified : false }
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'all'});
        }
        else{
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, pageType: 'all'});
        }
    });
});

router.post('/admin/email/verification/all/send', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    var query2 = { verified : false }
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query1).find(query2).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                    var nameType = mail.studentname
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                    var nameType = mail.participantname
                }
                else{
                    var tempMail = mail.schoolemail
                    var nameType = mail.teachername
                }
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
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                <style>
                @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
                
                * {
                    margin: 0;
                    padding: 0;
                    font-family: "Comfortaa", cursive;
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
                    .card{
                        width: 60vw !important;
                        margin:0 !important;
                    }
                    .textContainer{
                        font-size: 2vw !important;
                        padding:0 !important;
                    }
                    .endText{
                        font-size: 2.5vw !important;
                    }
                }
                </style>
                <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                </div>
                <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                <h2 style="margin-bottom: 20px;">Hey ${nameType} !</h2>
                <h2 style="margin-top:30px">You need to verify your account to participate and/or to claim any prizes. Please verify your account by clicking on the button below-</h2>
                </div>
                <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${mail.verification}" target="_blank">Verify Here</a>
                </div>
                <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                <div class="endText" style="margin-bottom: 40px;">
                We look forward to your active participation and co-operation to make
                this endeavor a grand success.
                <br /><br />
                Thank You.
                <br /><br />
                Team (c)ypher, DPS Bhopal
                </div>
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-verification-send', { title: 'Send Mail', error : err, pageType: 'all'});
                }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'all'});
                        }
                        else 
                        return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'all'});
                    });
                }
            }, i * interval)
        });  
    });
});

// --------------------------------------------------------------- //

// -------- Send Verification Mail to Specific Post Route --------  //

router.post('/admin/email/verification/specific', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query2 = { verified : false }
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query).find(query2).find(query4).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'specific'});
        }
        else{
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, pageType: 'specific'});
        }
    });
});

router.post('/admin/email/verification/specific/send', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    var query2 = { verified : false }
    if (req.body.studentType == 'Student'){
        var query4 = { username: req.body.username }
    }
    else if (req.body.studentType == 'School'){
        var query4 = { $and: [{username: req.body.username}, {type: 'School'}] }
    }
    else{
        var query4 = { $and: [{username: req.body.username}, {type: 'Participant'}] }
    }
    User.find().find(query1).find(query2).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                    var nameType = mail.studentname
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                    var nameType = mail.participantname
                }
                else{
                    var tempMail = mail.schoolemail
                    var nameType = mail.teachername
                }
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
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                <style>
                @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
                
                * {
                    margin: 0;
                    padding: 0;
                    font-family: "Comfortaa", cursive;
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
                    .card{
                        width: 60vw !important;
                        margin:0 !important;
                    }
                    .textContainer{
                        font-size: 2vw !important;
                        padding:0 !important;
                    }
                    .endText{
                        font-size: 2.5vw !important;
                    }
                }
                </style>
                <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                </div>
                <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                <h2 style="margin-bottom: 20px;">Hey ${nameType} !</h2>
                <h2 style="margin-top:30px">You need to verify your account to participate and/or to claim any prizes. Please verify your account by clicking on the button below-</h2>
                </div>
                <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${mail.verification}" target="_blank">Verify Here</a>
                </div>
                <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                <div class="endText" style="margin-bottom: 40px;">
                We look forward to your active participation and co-operation to make
                this endeavor a grand success.
                <br /><br />
                Thank You.
                <br /><br />
                Team (c)ypher, DPS Bhopal
                </div>
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-verification-send', { title: 'Send Mail', error : err, pageType: 'specific'});
                }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'specific'});
                        }
                        else 
                        return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Verification mail sent successfully.', pageType: 'specific'});
                    });
                }
            }, i * interval)
        });  
    });
});


// --------------------------------------------------------------- //

// ----- Send Verification Mail with Custom Query Post Route -----  //

router.post('/admin/email/verification/custom', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(fieldName).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'custom'});
        }
        else{
            return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, value1: Value1, value2: Value2, pageType: 'custom' });
        }
    });
});
router.post('/admin/email/verification/custom/send', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query2 = { verified : false}
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(query2).find(fieldName).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                    var nameType = mail.studentname
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                    var nameType = mail.participantname
                }
                else{
                    var tempMail = mail.schoolemail
                    var nameType = mail.teachername
                }
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
                <body style="color: #fff;width:fit-content;background-color: transparent;">
                <style>
                @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
                
                * {
                    margin: 0;
                    padding: 0;
                    font-family: "Comfortaa", cursive;
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
                    .card{
                        width: 60vw !important;
                        margin:0 !important;
                    }
                    .textContainer{
                        font-size: 2vw !important;
                        padding:0 !important;
                    }
                    .endText{
                        font-size: 2.5vw !important;
                    }
                }
                </style>
                <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                </div>
                <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                <h2 style="margin-bottom: 20px;">Hey ${nameType} !</h2>
                <h2 style="margin-top:30px">You need to verify your account to participate and/or to claim any prizes. Please verify your account by clicking on the button below-</h2>
                </div>
                <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${mail.verification}" target="_blank">Verify Here</a>
                </div>
                <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                <div class="endText" style="margin-bottom: 40px;">
                We look forward to your active participation and co-operation to make
                this endeavor a grand success.
                <br /><br />
                Thank You.
                <br /><br />
                Team (c)ypher, DPS Bhopal
                </div>
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-verification-send', { title: 'Send Mail', error : err, pageType: 'custom'});
                }
                else
                transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                    return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Mail sent successfully.', pageType: 'custom'});
                    else 
                    return res.render('admin-email-verification-send', { title: 'Send Mail', error : 'Mail sent successfully.', pageType: 'custom'});
                });
            }, i * interval)
        })
    });
});

// --------------------------------------------------------------- //

// ----------------------------------------------------------------------------- //

// --------------------- Send Credentials Mail Post Routes --------------------- //

// -------- Send Credentials Mail to Specific Post Route --------  //

router.post('/admin/email/credentials/specific', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var query4 = { participantname: {$ne: '(substitute)'}}
    User.find().find(query).find(query4).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'specific'});
        }
        else{
            return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, pageType: 'specific'});
        }
    });
});

router.post('/admin/email/credentials/specific/send', (req, res, next) => {
    var query1 = { username : { $ne: 'admin'}}
    if (req.body.studentType == 'Student'){
        var query4 = { username: req.body.username }
    }
    else if (req.body.studentType == 'School'){
        var query4 = { $and: [{username: req.body.username}, {type: 'School'}] }
    }
    else{
        var query4 = { $and: [{username: req.body.username}, {type: 'Participant'}] }
    }
    User.find().find(query1).find(query4).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                }
                else{
                    var tempMail = mail.schoolemail
                }
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
                    <body style="color: #fff;width:fit-content;background-color: transparent;">
                        <style>
                        @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
    
                        * {
                            margin: 0;
                            padding: 0;
                            font-family: "Comfortaa", cursive;
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
                            .card{
                                width: 60vw !important;
                                margin:0 !important;
                            }
                            .textContainer{
                                font-size: 2vw !important;
                                padding:0 !important;
                            }
                            .endText{
                                font-size: 2.5vw !important;
                            }
                        }
                        </style>
                        <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                            <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                            </div>
                            <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                                <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                                <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                                <p style="padding:20px">Username - ${mail.username}</p>
                                <p style="padding:20px">Password - ${mail.password1}</p>
                                <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                            </div>
                            <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${mail.verification}" target="_blank">Verify Here</a>
                            </div>
                            <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                                <div class="endText" style="margin-bottom: 40px;">
                                We look forward to your active participation and co-operation to make
                                this endeavor a grand success.
                                <br /><br />
                                Thank You.
                                <br /><br />
                                Team (c)ypher, DPS Bhopal
                                </div>
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-credentials-send', { title: 'Send Mail', error : err, pageType: 'specific'});
                }
                else{
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err){
                            console.log(err)
                            return res.render('admin-email-credentials-send', { title: 'Send Mail', mails: mails, error : 'Credentials mail sent successfully.', pageType: 'specific'});
                        }
                        else 
                        return res.render('admin-email-credentials-send', { title: 'Send Mail', mails: mails, error : 'Credentials mail sent successfully.', pageType: 'specific'});
                    });
                }
            }, i * interval)
        });  
    });
});

// --------------------------------------------------------------- //

// ----- Send Credentials Mail with Custom Query Post Route -----  //

router.post('/admin/email/credentials/custom', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(fieldName).exec(function(err, mails) {
        if (mails.length == 0){
            return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'No Records Found', pageType: 'custom'});
        }
        else{
            return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'Please Confirm', isList: true, mails: mails, value1: Value1, value2: Value2, pageType: 'custom' });
        }
    });
});
router.post('/admin/email/credentials/custom/send', (req, res, next) => {
    var query = { username : { $ne: 'admin'}}
    var Value1 = req.body.content
    var Value2 = req.body.inputQuery
    if (Value1 == 'verified'){
        var fieldName = { verified : Value2}
    }
    else if (Value1 == 'teachername'){
        var fieldName = { teachername : Value2}
    }
    else if (Value1 == 'teachernumber'){
        var fieldName = { teachernumber : Value2}
    }
    else if (Value1 == 'schoolemail'){
        var fieldName = { schoolemail : Value2}
    }
    else if (Value1 == 'code'){
        var fieldName = { code : Value2}
    }
    else if (Value1 == 'studentname'){
        var fieldName = { studentname : Value2}
    }
    else if (Value1 == 'studentevent'){
        var fieldName = { studentevent : Value2}
    }
    else if (Value1 == 'studentemail'){
        var fieldName = { studentemail : Value2}
    }
    else if (Value1 == 'studentnumber'){
        var fieldName = { studentnumber : Value2}
    }
    else if (Value1 == 'participantname'){
        var fieldName = { participantname : Value2}
    }
    else if (Value1 == 'participantevent'){
        var fieldName = { participantevent : Value2}
    }
    else if (Value1 == 'participantemail'){
        var fieldName = { participantemail : Value2}
    }
    else if (Value1 == 'participantnumber'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'substitute'){
        var fieldName = { substitute : Value2}
    }
    else if (Value1 == 'username'){
        var fieldName = { username : Value2}
    }
    else if (Value1 == 'schoolname'){
        var fieldName = { schoolname : Value2}
    }
    else if (Value1 == 'type'){
        var fieldName = { type : Value2}
    }
    else{
        return res.render('admin-email-credentials-send', { title: 'Send Mail', error : 'No such field.', pageType: 'custom'});
    }
    User.find().find(query).find(fieldName).exec(function(err, mails) {
        let interval = 1200;
        mails.forEach((mail, i) => {
            setTimeout(() => {
                if (mail.type == 'Student'){
                    var tempMail = mail.studentemail
                }
                else if (mail.type == 'Participant'){
                    var tempMail = mail.participantemail
                }
                else{
                    var tempMail = mail.schoolemail
                }
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
                    <body style="color: #fff;width:fit-content;background-color: transparent;">
                        <style>
                        @import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;500;700&display=swap");
    
                        * {
                            margin: 0;
                            padding: 0;
                            font-family: "Comfortaa", cursive;
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
                            .card{
                                width: 60vw !important;
                                margin:0 !important;
                            }
                            .textContainer{
                                font-size: 2vw !important;
                                padding:0 !important;
                            }
                            .endText{
                                font-size: 2.5vw !important;
                            }
                        }
                        </style>
                        <section class="card" style="background-color: #080808;width: 50vw;border: 1px solid #fff;padding: 50px;position: relative;border-radius: 10px;">
                            <div class="imgContainer" style="width:fit-content;margin:0 auto;">
                                <img src="https://static.clubcypher.club/img/cypher.png" style="height:auto;width:10vw;" alt="decypher" />
                            </div>
                            <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                                <h2 style="margin-bottom: 20px;">Thank you for registering for (c)ync!</h2>
                                <h2 style="margin-top:30px;margin-bottom:50px">Here are your credentials-</h2>
                                <p style="padding:20px">Username - ${mail.username}</p>
                                <p style="padding:20px">Password - ${mail.password1}</p>
                                <h2 style="margin-top:30px">Please verify your account by clicking on the button below-</h2>
                            </div>
                            <div class="button" style="width:fit-content;margin:0 auto;padding: 40px 0;">
                                <a style="color: #DA1893;border: 1px solid #DA1893;padding: 20px 30px;font-size: 3vw;width: 100%;text-align: center;text-decoration: none;" href="https://www.clubcypher.club/verify/${mail.verification}" target="_blank">Verify Here</a>
                            </div>
                            <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                                <div class="endText" style="margin-bottom: 40px;">
                                We look forward to your active participation and co-operation to make
                                this endeavor a grand success.
                                <br /><br />
                                Thank You.
                                <br /><br />
                                Team (c)ypher, DPS Bhopal
                                </div>
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
                    subject: "Registration Details",
                    text: output,
                    html: output,
                };
                if (err) {
                    return res.render('admin-email-credentials-send', { title: 'Send Mail', error : err, pageType: 'custom'});
                }
                else
                transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                    return res.render('admin-email-credentials-send', { title: 'Send Mail', mails: mails, error : 'Credentials Mail sent successfully.', pageType: 'custom'});
                    else 
                    return res.render('admin-email-credentials-send', { title: 'Send Mail', mails: mails, error : 'Credentials Mail sent successfully.', pageType: 'custom'});
                });
            }, i * interval)
        })
    });
});

// --------------------------------------------------------------- //

// ----------------------------------------------------------------------------- //


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
router.get('/admin/list', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { username: { $ne: 'admin' } }
            var query2 = { participantname: { $ne: '(substitute)' } }
            User.find().find(query1).find(query2).sort('type').exec(function(err, teams1) {
                return res.render('admin-event-teams', { teams: teams1, eventOver: true, title:'Participants', isList: true});
            });
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
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { username: { $ne: 'admin' } }
            var query2 = { type: 'Student' }
            User.find().find(query1).find(query2).sort('studentevent').sort('time').exec(function(err, teams1) {
                return res.render('admin-event-teams', { teams: teams1, eventOver: true, title:'Participants', isEdit: true});
            });
        }
    }
    else{
        res.redirect('/login')
    }
});

router.get('/admin/manage/teams/student/:editUsername', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'Student'}
    var query2 = {username : req.params.editUsername}
    User.find().find(query).find(query2).exec(function(err, teams) {
      return res.render('admin-manage-teams', { teams: teams, title: 'Manage Teams', userType:'Student', editUsername: req.params.editUsername });
    });
});
  
router.post('/admin/manage/teams/student/:editUsername', (req, res, next) => {
    var templink = '/admin/manage/teams/student/' + req.body.username;
    User.findOne({username: req.body.username}, function(err, user) {
        user.username = req.body.newUsername;
        user.schoolname = req.body.newSchoolName;
        user.studentname = req.body.newStudentName;
        user.studentevent = req.body.newStudentEvent;
        user.studentemail = req.body.newStudentEmail;
        user.studentnumber = req.body.newStudentNumber;
        user.save();
    });
    return res.redirect(templink);
});

 // School Team Edit
router.get('/admin/manage/teams/school', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { username: { $ne: 'admin' } }
            var query2 = { type: 'School' }
            User.find().find(query1).find(query2).sort('time').exec(function(err, teams1) {
                return res.render('admin-event-teams', { teams: teams1, eventOver: true, title:'Participants', isEdit: true});
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/manage/teams/school/:editUsername', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'School'}
    var query2 = {code : req.params.editUsername}
    User.find().find(query).find(query2).exec(function(err, teams) {
        return res.render('admin-manage-teams', { teams: teams, title: 'Manage Teams', userType:'School', editUsername: req.params.editUsername });
    });
});
router.post('/admin/manage/teams/school/:editUsername', (req, res, next) => {
    var templink = '/admin/manage/teams/school/' + req.body.newCode;
    User.findOne({$and: [{code: req.body.newCode}, {type: 'School'}]}, function(err, user) {
        user.username = req.body.newUsername;
        user.schoolname = req.body.newSchoolName;
        user.teachername = req.body.newTeacherName;
        user.teachernumber = req.body.newTeacherNumber;
        user.schoolemail = req.body.newSchoolEmail;
        user.save();
    });
    return res.redirect(templink);
});

 // Participant Team Edit
router.get('/admin/manage/teams/participant', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var query1 = { username: { $ne: 'admin' } }
            var query2 = { type: 'Participant' }
            User.find().find(query1).find(query2).sort('time').exec(function(err, teams1) {
                return res.render('admin-event-teams', { teams: teams1, eventOver: true, title:'Participants', isEdit: true});
            });
        }
    }
    else{
        res.redirect('/login')
    }
});
router.get('/admin/manage/teams/participant/:editUsername', (req, res, next) => {
    if (req.user.username != 'admin' || !req.user.username) {
      res.redirect('/');
    }
    var query = {type : 'Participant'}
    var query2 = {password1 : req.params.editUsername}
    User.find().find(query).find(query2).exec(function(err, teams) {
        return res.render('admin-manage-teams', { teams: teams, title: 'Manage Teams', userType:'Participant', editUsername: req.params.editUsername });
    });
});
router.post('/admin/manage/teams/participant/:editUsername', (req, res, next) => {
    var templink = '/admin/manage/teams/participant/' + req.body.newPassword;
    User.findOne({password1: req.body.newPassword}, function(err, user) {
        user.username = req.body.newUsername;
        user.schoolname = req.body.newSchoolName;
        user.participantname = req.body.newParticipantName;
        user.participantevent = req.body.newParticipantEvent;
        user.participantemail = req.body.newParticipantEmail;
        user.participantnumber = req.body.newParticipantNumber;
        user.save();
    });
    return res.redirect(templink);
});



router.get('/admin/verified', (req, res, next) => {
    if (req.user){
        if (req.user.username != 'admin') {
            res.redirect('/dashboard');
        }
        else{
            var sort = { type: -1 };
            User.find().sort('verified').sort(sort).exec(function(err, teams1) {
                return res.render('admin-verify-list', { teams: teams1, eventOver: true, title: 'Verification Status' });
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