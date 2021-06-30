var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var compression = require('compression');
var MongoStore = require('connect-mongo');
var LocalStrategy = require('passport-local').Strategy;
mongoose.Promise = require('bluebird');
const cluster = require('cluster');
const totalCPUs = require('os').cpus().length;

// if (cluster.isMaster) {
//   console.log(`Number of CPUs is ${totalCPUs}`);
//   console.log(`Master ${process.pid} is running`);

//   // Fork workers.
//   for (let i = 0; i < totalCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     console.log("Let's fork another worker!");
//     cluster.fork();
//   });

// } 
// else {


  var app = express();

  //Make new databse
  mongoose.connect(
    "mongodb+srv://itsak:hipeople@clubcypher.bd6md.mongodb.net/clubcypher?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    }
  );
  mongoose.set('useNewUrlParser', true);
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  // mongoose.connect("mongodb://localhost:27017/decypher")
  var db = mongoose.connection;
  //If Mongo Error
  db.on('error', console.error.bind(console, 'connection error'));
  app.set("trust proxy", 1);
  // //Setting up sessions+cookies
  // var sessionConfig = {
  //   secret: 'MucahitBruh',
  //   resave: false,
  //   saveUninitialized: false,
  //   store: MongoStore.create({ mongoUrl: 'mongodb+srv://itsak:hipeople@clubcypher.bd6md.mongodb.net/clubcypher?retryWrites=true&w=majority' }),

  // }
  // app.use(session(sessionConfig));
  // app.use(passport.initialize());
  // app.use(passport.session());

  var sessionConfig = {
    secret: 'MucahitBruh',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://itsak:hipeople@clubcypher.bd6md.mongodb.net/clubcypher?retryWrites=true&w=majority' }),

  }
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  var User = require('./models/user');
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  

  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
  });
  //Setting up body-parser
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  // Compress all HTTP responses
  app.use(compression());

  // //Setting public directory
  // app.use(express.static(__dirname + '/public'));
  // app.use(express.static(__dirname + '/obfuscated'));

  //Setting view engine
  app.set('view engine', 'pug');
  app.set('views', __dirname + '/views2');

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://distracted-wescoff-b1d8d6.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    return next();
  });
  //Setting routes
  var routes = require('./routes/index');
  app.use('/', routes);


  //404
  app.use((res, req, next) => {
    var err = new Error('File not found!');
    err.status = 404;
    next(err);
  });

  //Error Handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      title: 'Error',
      message: err.message,
      error: {}
    });
  });
  // // DDOS Protection
  // const rateLimit = require("express-rate-limit");

  // // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // // see https://expressjs.com/en/guide/behind-proxies.html

  // const apiLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100
  // });

  // // only apply to requests that begin with /api/
  // app.use("/api/", apiLimiter);

  // HTTP / 1.1
  // Listening
  app.listen(process.env.PORT || 5000);


  // HTTP / 2
  // var port = 5000
  // var spdy = require('spdy')
  // var path = require('path')
  // var fs = require('fs')

  // var options = {
  //   key: fs.readFileSync(__dirname + '/server.key'),
  //   cert:  fs.readFileSync(__dirname + '/server.crt')
  // }

  // //Listening
  // spdy
  //   .createServer(options, app)
  //   .listen(port, (error) => {
  //     if (error) {
  //       console.error(error)
  //       return process.exit(1)
  //     } else {
  //       console.log('Listening on port: ' + port + '.')
  //     }
  //   })
// }