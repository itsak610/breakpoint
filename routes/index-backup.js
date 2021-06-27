// -------------------------------------------------------- Functions and Variables -------------------------------------------------------- //


var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var nodemailer = require('nodemailer');
var School = require("../models/school");
var Student = require('../models/student');
var LocalStrategy = require('passport-local').Strategy;


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

router.get('/over', midWare, (req, res) => {
  if(!eventIsOn){
    return res.render('over', { title: 'Event Over'});
  }
  else{
    res.redirect('/');
  }
});




// -------------------------------------------------------- Normal Routes -------------------------------------------------------- //

router.get('/', midWare, (req, res, next) => {
  return res.redirect('/home');
});
router.get('/home', midWare, (req, res, next) => {
  return res.render('home', { title: 'De(c)ypher' });
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
router.get('/register', midWare, (req, res, next) => {
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
  passport.use('school-local', new LocalStrategy(School.authenticate()));
  passport.serializeUser(School.serializeUser());
  passport.deserializeUser(School.deserializeUser());
  if (req.user){
    return res.redirect('/dashboard')
  }
  else{
    return res.render('school-login', { title: 'School Login' });
  }
});

router.post('/school/login', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  passport.authenticate('school-local', function(err, school) {
    if (err) {
      return res.render('school-login', { title: 'School Login', error : err.message });
    }
    else if (school) {
      req.logIn(school, function(err) {
        return res.redirect('/dashboard');
      });
    }
    else {
      return res.render('school-login', { title: 'School Login', error : 'Wrong username/password.' });

    }
  })(req, res, next);
});

router.get('/school/register', midWare, (req, res, next) => {
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
    return res.render('school-register', { title: 'School Register', error : 'The passwords dont match.' });
  }
  else{
    School.register(new School({
      username : req.body.username,
      teachername : req.body.teachername,
      schoolname : req.body.schoolname,
      schoolemail: req.body.schoolemail,
      type : "school",
      code: makeid(8),
    }), req.body.password, function(err, user) {
      var output = `<p>Thanks for registering to de(c)ypher. Here are your credentials!</p>
      <h3>Credentials</h3>
      <li>Username: ${req.body.username}</li>
      <li>Password: ${req.body.password}</li>`
      var da_mail = `${req.body.schoolemail}`
      const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
      type: 'OAuth2',
      user: 'cypherdps@gmail.com',
      clientId: '628363329112-ej11f4erf7ipbi58uc8io8a0ukb88occ.apps.googleusercontent.com',
      clientSecret: '2h2yGWhURcfHS48w0Uqrv19Q',
      refreshToken: '1/R_093ZTq2nVGyT8EJMyM5XF7WtET3talDOJPwxUrSag'  
      }
      });
      var mailOptions = {
      to: da_mail,
      from: 'cypherdps@gmail.com',
      subject: 'De(c)ypher creds',
      html: output
      };
    if (err) {
      return res.render('school-register', { title: 'School Register', error : 'The school has already been registered.' });
    }
    else
        transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            return res.render('school-register', { title: 'School Register', error : 'School registered successfully.' });
          else 
            return res.render('school-register', { title: 'School Register', error : 'School registered successfully. Credentials sent to your email' });
        });
    });
  }
});



// -------------------------------------------------------- Student Routes -------------------------------------------------------- //

router.get('/student/login', (req, res, next) => {
  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  passport.use('student-local', new LocalStrategy(Student.authenticate()));
  passport.serializeUser(Student.serializeUser());
  passport.deserializeUser(Student.deserializeUser());
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else if (!req.user){
    return res.render('student-login', { title: 'Student Login' });
  }
});

router.post('/student/login', (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  passport.authenticate('student-local', function(err, student) {
    if (err) {
      return res.render('student-login', { title: 'Student Login', error : err.message });
    }
    else if (student) {
      req.logIn(student, function(err) {
        return res.redirect('/dashboard');
      });
    }
    else {
      return res.render('student-login', { title: 'Student Login', error : 'Wrong username/password.' });
    }
  })(req, res, next);
});

router.get('/student/register', midWare, (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if (req.user) {
    return res.redirect('/dashboard');
  }
  else{
    return res.render('student-register', { title: 'Student Register' });
  }
});

router.post('/student/register', function(req, res) {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  if(req.body.password != req.body.passwordConfirm){
    return res.render('student-register', { title: 'Student Register', error : 'The passwords dont match.' });
  }
  else{
    Student.register(new Student({
      username : req.body.username,
      name : req.body.name,
      event : req.body.event,
      email : req.body.email,
      phonenumber: req.body.phonenumber,
      schoolname : req.body.schoolname,
      type : "student",
    }), req.body.password, function(err, user) {
      var output = `<p>Thanks for registering to de(c)ypher. Here are your credentials!</p>
      <h3>Credentials</h3>
      <li>Username: ${req.body.username}</li>
      <li>Password: ${req.body.password}</li>`
      var da_mail = `${req.body.Studentemail}`
      const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
      type: 'OAuth2',
      user: 'cypherdps@gmail.com',
      clientId: '628363329112-ej11f4erf7ipbi58uc8io8a0ukb88occ.apps.googleusercontent.com',
      clientSecret: '2h2yGWhURcfHS48w0Uqrv19Q',
      refreshToken: '1/R_093ZTq2nVGyT8EJMyM5XF7WtET3talDOJPwxUrSag'  
      }
      });
      var mailOptions = {
      to: da_mail,
      from: 'cypherdps@gmail.com',
      subject: 'De(c)ypher creds',
      html: output
      };
    if (err) {
      return res.render('student-register', { title: 'Student Register', error : 'The Student has already been registered.' });
    }
    else
        transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully.' });
          else 
            return res.render('student-register', { title: 'Student Register', error : 'Student registered successfully. Credentials sent to your email' });
        });
    });
  }
});



// -------------------------------------------------------- Participant Routes -------------------------------------------------------- //









// -------------------------------------------------------- Admin Routes -------------------------------------------------------- //

// Admin Panel Route
router.get('/admin', (req, res) => {
  if(req.user.username != 'admin') {
    res.redirect('/admin/login');
  }
  else{
    return res.render('admin', { title: 'Admin Panel' });
  }
});

//Render manage teams page
router.get('/admin/teams', (req, res, next) => {
  if (req.user.username != 'admin' || !req.user.username) {
    res.redirect('/');
  }
  User.find().sort('-level').sort('lastLevelOn').exec(function(err, teams) {
    Question.find().sort('level').exec(function(err, question) {
      return res.render('teams', { teams: teams, questions: question, title: 'Manage Teams' });
    });
  });
});

//SET LEVEL for teams
router.post('/admin/teams', (req, res, next) => {
  User.findOne({username: req.body.username}, function(err, user) {
    user.level = req.body.newLevel;
    user.lastLevelOn = new Date();
    user.save();
  });
  return res.redirect('/admin/teams');
});

router.get('/admin/delete', (req, res, next) => {
  if (req.user.username != 'admin' || !req.user.username) {
    res.redirect('/');
  }
  User.find().sort('username').sort('lastLevelOn').exec(function(err, teams) {
    return res.render('delete', { teams: teams, title: 'Delete Users' });
  });
});

router.post('/admin/delete', (req, res, next) => {
  User.findOne({username: req.body.username}).remove().exec();
  return res.redirect('/admin/delete');
});

router.get('/dashboard', (req, res, next) => {

  if(!eventIsOn){
    return res.render('over', {title: "Event Over"});

  }
  if (req.user) {
    return res.render('dashboard', { title: 'Dashboard' });
  }
  else{
    return res.redirect('/login')
  }
});

//LOGOUT user
router.get('/logout', midWare, (req, res, next) => {
  req.session.destroy();
  req.logout();
  res.redirect('/login')
});


module.exports = router;