// -------------------------------------------------------- Functions and Variables -------------------------------------------------------- //


var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var nodemailer = require('nodemailer');
var User = require("../models/user");
var LocalStrategy = require('passport-local').Strategy;
const { find } = require('../models/user');


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
    User.register(new User({
      username : req.body.username,
      schoolname : req.body.schoolname,
      type : "School",
      teachername : req.body.teachername,
      teachernumber : req.body.teachernumber,
      schoolemail: req.body.schoolemail,
      verification: makeid(64),
      code: makeid(8),
      time: new Date(),
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
    User.register(new User({
      username : req.body.username,
      schoolname : req.body.schoolname,
      type : "Student",
      studentname : req.body.name,
      studentevent : req.body.event,
      studentemail : req.body.email,
      studentnumber: req.body.phonenumber,
      verification: makeid(64),
      time: new Date(),
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
    }
    );
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

router.get('/school/participant/register', midWare, (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  var currentUserType = req.user.type;
  if (!req.user) {
    return res.redirect('/login');
  }
  else{
    if(currentUserType=="School"){
      return res.render('participant-register', { title: 'Participant Register' });
    }
    else{
      return res.redirect('/dashboard')
    }
  }
});

router.get('/school/participant/register/click', midWare, (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  var currentUserType = req.user.type;
  if (!req.user) {
    return res.redirect('/login');
  }
  else{
    if(currentUserType=="School"){
      return res.render('click-register', { title: '(c)lick Register' });
    }
    else{
      return res.redirect('/dashboard')
    }
  }
});

router.get('/school/participant/register/clipped', midWare, (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  var currentUserType = req.user.type;
  if (!req.user) {
    return res.redirect('/login');
  }
  else{
    if(currentUserType=="School"){
      return res.render('clipped-register', { title: '(c)lipped Register' });
    }
    else{
      return res.redirect('/dashboard')
    }
  }
});

router.get('/school/participant/register/crosshair', midWare, (req, res, next) => {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  var currentUserType = req.user.type;
  if (!req.user) {
    return res.redirect('/login');
  }
  else{
    if(currentUserType=="School"){
      return res.render('crosshair-register', { title: '(c)rosshair Register' });
    }
    else{
      return res.redirect('/dashboard')
    }
  }
});

router.post('/school/participant/register/click', function(req, res) {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  else{
    User.register(new User({
      username : (req.user.username) + '01' + '01',
      password1 : (req.user.code) + '01' + '01',
      schoolname : req.user.schoolname,
      type : "Participant",
      code : req.user.code,
      participantname : req.body.name1,
      participantevent : "click",
      participantemail : req.body.email1,
      participantnumber: req.body.number1,
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '01' + '01'), function(err, user) {
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
        return res.render('click-register', { title: '(c)lick Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('click-register', { title: '(c)lick Register', error : 'Team registered successfully.' });
            else 
              return res.render('click-register', { title: '(c)lick Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      }
    );
    User.register(new User({
      username : (req.user.username) + '01' + '02',
      password1 : (req.user.code) + '01' + '02',
      schoolname : req.user.schoolname,
      type : "Participant",
      code : req.user.code,
      participantname : req.body.name2,
      participantevent : "click",
      participantemail : req.body.email2,
      participantnumber: req.body.number2,
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '01' + '02'), function(err, user) {
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
        return res.render('click-register', { title: '(c)lick Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('click-register', { title: '(c)lick Register', error : 'Team registered successfully.' });
            else 
              return res.render('click-register', { title: '(c)lick Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      }
    );
  }
});
router.post('/school/participant/register/clipped', function(req, res) {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  else{
    User.register(new User({
      username : (req.user.username) + '02' + '01',
      password1 : (req.user.code) + '02' + '01',
      schoolname : req.user.schoolname,
      type : "Participant",
      code : req.user.code,
      participantname : req.body.name1,
      participantevent : "clipped",
      participantemail : req.body.email1,
      participantnumber: req.body.number1,
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '02' + '01'), function(err, user) {
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
        return res.render('clipped-register', { title: '(c)lipped Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully.' });
            else 
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      }
    );
    User.register(new User({
      username : (req.user.username) + '02' + '02',
      password1 : (req.user.code) + '02' + '02',
      schoolname : req.user.schoolname,
      type : "Participant",
      code : req.user.code,
      participantname : req.body.name2,
      participantevent : "clipped",
      participantemail : req.body.email2,
      participantnumber: req.body.number2,
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '02' + '02'), function(err, user) {
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
        return res.render('clipped-register', { title: '(c)lipped Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully.' });
            else 
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      }
    );
    User.register(new User({
      username : (req.user.username) + '02' + '03',
      password1 : (req.user.code) + '02' + '03',
      schoolname : req.user.schoolname,
      type : "Participant",
      code : req.user.code,
      participantname : req.body.name3,
      participantevent : "clipped",
      participantemail : req.body.email3,
      participantnumber: req.body.number3,
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '02' + '03'), function(err, user) {
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
        return res.render('clipped-register', { title: '(c)lipped Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully.' });
            else 
              return res.render('clipped-register', { title: '(c)lipped Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      })}
});

router.post('/school/participant/register/crosshair', function(req, res) {
  if(!eventIsOn){
    res.render('over', {title: "Event Over"});
  }
  else{
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
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '03' + '01'), function(err, user) {
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
        return res.render('croshair-register', { title: '(c)roshair Register', error : 'The Team has already been registered.' });
      }
      else
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              return res.render('croshair-register', { title: '(c)roshair Register', error : 'Team registered successfully.' });
            else 
              return res.render('croshair-register', { title: '(c)croshair Register', error : 'Team registered successfully. Credentials sent to your email' });
          });
      }
    )
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
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '03' + '02'), function(err,user){;
        if (err) {
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Error: The team has already been registered.' });
        }
        else{
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.' });
        }
    });
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
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '03' + '03'), function(err,user){;
        if (err) {
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Error: The team has already been registered.' });
        }
        else{
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.' });
        }
    });
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
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '03' + '04'), function(err,user){;
        if (err) {
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Error: The team has already been registered.' });
        }
        else{
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.' });
        }
    });
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
      verification: makeid(64),
      time: new Date(),
    }), ((req.user.code) + '03' + '05'), function(err,user){;
        if (err) {
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Error: The team has already been registered.' });
        }
        else{
            return res.render('crosshair-register', { title: '(c)rosshair Register', error : 'Team registered successfully.' });
        }
    })
  }
});

router.get('/school/teams', midWare, (req, res, next) => {
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
                return res.render('admin-participants', { teams: teams3, eventOver: true, title: 'View Participants' });
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
                return res.render('admin-school', { teams: teams3, eventOver: true, title: 'School Details' });
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
            var query1 = { type: 'Participant' }
            var query2 = { participantevent: req.params.event }
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
        if(err){
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
router.get('/logout', midWare, (req, res, next) => {
  req.session.destroy();
  req.logout();
  res.redirect('/login')
});


module.exports = router;