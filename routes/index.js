// -------------------------------------------------------- Functions and Variables -------------------------------------------------------- //

var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var passport = require("passport");
var User = require("../models/user");
var Email = require("../models/email");
var LocalStrategy = require("passport-local").Strategy;
const { find } = require("../models/user");

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ----------------------------------------------------------- Automatic Mailer -----------------------------------------------------------  //

const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID =
    "474808675151-eiic6024t134klcb7c6ht746f709ettv.apps.googleusercontent.com";
const CLEINT_SECRET = "zLitl-wTq7VdwibxCVH5hD-d";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
    "1//04NYseHxINgY5CgYIARAAGAQSNwF-L9IrZgWoVr0iuK_Lejr2EtCyviQFDndvLHrDrCd717x5vyGD5WfBXL6HNEzhtwUQcqheFns";

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLEINT_SECRET,
    REDIRECT_URI
);
oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ------------------------------------------------------------- Normal Routes ------------------------------------------------------------- //

router.get("/", (req, res, next) => {
    return res.redirect("/home");
});

router.get("/home", (req, res, next) => {
    return res.render("home", {
        title: "Tethics Excellence Academy",
    });
});

router.get("/login", (req, res, next) => {
    if (req.user) {
        return res.redirect("/dashboard");
    } else if (!req.user) {
        return res.render("login", {
            title: "Login",
        });
    }
});

router.get("/logout", (req, res, next) => {
    req.session.destroy();
    req.logout();
    res.redirect("/login");
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ----------------------------------------------------------- Logged In Routes -----------------------------------------------------------  //

router.get("/dashboard", (req, res, next) => {
    if (req.user) {
        if (req.user.username != "admin") {
            return res.render("dashboard");
        } else {
            return res.redirect("/admin");
        }
    } else {
        return res.redirect("/login");
    }
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ------------------------------------------------------------- Login Routes -------------------------------------------------------------  //

router.post("/login", (req, res, next) => {
    if (req.body.type == "student") {
        passport.authenticate("local", function (err, user) {
            if (!user) {
                return res.render("login", {
                    title: "Login",
                    error: "Wrong username/password.",
                });
            }
            req.logIn(user, function (err) {
                if (req.user.username != "admin") {
                    if (req.user.type != "student") {
                        req.session.destroy();
                        req.logout();
                        return res.render("login", {
                            title: "Login",
                            error: "Wrong username/password.",
                        });
                    } else {
                        return res.redirect("/dashboard");
                    }
                } else {
                    return res.redirect("/admin");
                }
            });
        })(req, res, next);
    } else if (req.body.type == "teacher") {
        passport.authenticate("local", function (err, user) {
            if (!user) {
                return res.render("login", {
                    error: "Wrong username/password.",
                });
            }
            req.logIn(user, function (err) {
                if (req.user.username != "admin") {
                    if (req.user.type != "teacher") {
                        req.session.destroy();
                        req.logout();
                        return res.render("login", {
                            title: "Login",
                            error: "Wrong username/password.",
                        });
                    } else {
                        return res.redirect("/dashboard");
                    }
                } else {
                    return res.redirect("/admin");
                }
            });
        })(req, res, next);
    }
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ---------------------------------------------------------------- Enrollment Routes ---------------------------------------------------------------- //

router.post("/enrollment", (req, res, next) => {
    Email.addEmail(req.body.email, new Date(), (err) => {
        if (err) {
            var query1 = { email: req.body.email };
            Email.find()
                .find(query1)
                .exec(function (err, emailaddress) {
                    return res.render("home", {
                        error: err,
                    });
                });
        } else {
            var query1 = { email: req.body.email };
            Email.find()
                .find(query1)
                .exec(function (err, emailaddress) {
                    for (i in emailaddress) {
                        var tempMail = emailaddress[i].email;
                        var output = `
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
                            <img src="https://tethics-breakpoint.herokuapp.com/img/logo.png" style="height:auto;width:10vw;" alt="tea" />
                        </div>
                        <div class="textContainer" style="text-align: center;font-size: 20px;padding:30px 0;">
                            <h2 style="margin-bottom: 20px;">Tethics Excellence Academy</h2>
                        </div>
                        <div class="content" style="width:fit-content;margin:0 auto;">
                            <div class="left" style="width: fit-content;padding: 20px;margin:0 auto;">
                                <h3 style="width:fit-content;margin-bottom: 20px;margin:0 auto;padding:30px;">
                                    Thank you for enrolling your child in our school!
                                    Please reply to this email with the details of your child.
                                </h3>
                            </div>
                        </div>
                        <div class="end" style="padding: 20px;width: fit-content;margin:0 auto">
                            <div class="imgContainer2" style="width: fit-content; margin:0 auto">
                                <img src="https://https://tethics-breakpoint.herokuapp.com/img/tethics_icon.png" style="height:auto;width:20vw;margin:0 auto" alt="" />
                            </div>
                        </div>
                        </section>
                    </body>
                    </html>
                    `;

                        var da_mail = `${tempMail}`;

                        const accessToken = oAuth2Client.getAccessToken();

                        const transporter = nodemailer.createTransport({
                            service: "gmail",
                            auth: {
                                type: "OAuth2",
                                user: "breakpoint.tethics@gmail.com",
                                clientId: CLIENT_ID,
                                clientSecret: CLEINT_SECRET,
                                refreshToken: REFRESH_TOKEN,
                                accessToken: accessToken,
                            },
                        });

                        var mailOptions = {
                            from: '"Tethics Excellence Academy" <breakpoint.tethics@gmail.com>',
                            to: da_mail,
                            subject: "Enrollment",
                            text: output,
                            html: output,
                        };
                        if (err) {
                            return res.render("home", {
                                error: err,
                            });
                        } else
                            transporter.sendMail(
                                mailOptions,
                                function (err, info) {
                                    if (err) {
                                        console.log(err);
                                        return res.render("home", {
                                            error2: "Request Successful. We'll contact you soon!",
                                        });
                                    } else
                                        return res.render("home", {
                                            error2: "Request Successful. We'll contact you soon!",
                                        });
                                }
                            );
                    }
                });
        }
    });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

// ------------------------------------------------------------- Admin Routes -------------------------------------------------------------  //

router.get("/admin", (req, res) => {
    if (req.user) {
        if (req.user.username != "admin") {
            res.redirect("/dashboard");
        } else {
            return res.render("dashboard");
        }
    } else {
        res.redirect("/login");
    }
});

// ----------------------------------------------------------------------------------------------------------------------------------------- //

module.exports = router;
