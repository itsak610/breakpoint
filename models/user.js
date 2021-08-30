var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new Schema({
    username: String,
    email: String,
    password: String,
    name: String,
    number: Number,
    type: String,
    time: {
        type: Date,
    },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
