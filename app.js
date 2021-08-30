// -------------------------------------------------------- Functions and Variables -------------------------------------------------------- //

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var passport = require("passport");
var session = require("express-session");
var compression = require("compression");
var MongoStore = require("connect-mongo");
var LocalStrategy = require("passport-local").Strategy;
mongoose.Promise = require("bluebird");

var app = express();

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// --------------------------------------------------------- Connect Our Database ---------------------------------------------------------  //

mongoose.connect(
    "mongodb+srv://breakpoint:tethics1234@breakpoint.qzksm.mongodb.net/breakpoint?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    }
);
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error"));
app.set("trust proxy", 1);

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ---------------------------------------------------------- Setting up Cookies ----------------------------------------------------------  //

var sessionConfig = {
    secret: "Tethics",
    name: "Bruh",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl:
            "mongodb+srv://breakpoint:tethics1234@breakpoint.qzksm.mongodb.net/breakpoint?retryWrites=true&w=majority",
    }),
};
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

var User = require("./models/user");
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// -------------------------------------------------------- Setting up Body Parser --------------------------------------------------------  //

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// -------------------------------------------------------- Compress HTTP Responses -------------------------------------------------------- //

app.use(compression());

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ------------------------------------------------------ Setting Up Public Directory ------------------------------------------------------ //

app.use(express.static(__dirname + "/public"));

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// -------------------------------------------------------- Setting Up View Engine --------------------------------------------------------  //

app.set("view engine", "pug");
app.set("views", [
    __dirname + "/views",
    __dirname + "/views/admin",
    __dirname + "/views/static",
    __dirname + "/views/student",
    __dirname + "/views/teacher",
]);
// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ----------------------------------------------------------- Setting Up Routes ----------------------------------------------------------- //

var routes = require("./routes/index");
app.use("/", routes);

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// --------------------------------------------------------------- 404 Page ---------------------------------------------------------------  //

app.use((res, req, next) => {
    var err = new Error("File not found!");
    err.status = 404;
    next(err);
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// -------------------------------------------------------------- Error Page --------------------------------------------------------------  //

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render("error", {
        title: "Error",
        message: err.message,
        error: {},
    });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// -------------------------------------------------------------- HTTP / 1.1 --------------------------------------------------------------  //

app.listen(process.env.PORT || 5000);

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// --------------------------------------------------------------- HTTP / 2 ---------------------------------------------------------------  //

// var port = 5000
// var spdy = require('spdy')
// var path = require('path')
// var fs = require('fs')

// var options = {
//   key: fs.readFileSync(__dirname + '/server.key'),
//   cert:  fs.readFileSync(__dirname + '/server.crt')
// }

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

// ----------------------------------------------------------------------------------------------------------------------------------------- //
