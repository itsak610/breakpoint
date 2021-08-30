var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var EmailSchema = new Schema({
    email: String,
    time: {
        type: Date,
    },
});

EmailSchema.statics.addEmail = function (email, time, callback) {
    var automail = new Email({
        email: email,
        time: time,
    });
    automail.save(function (err) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, automail);
        }
    });
};

var Email = mongoose.model("Email", EmailSchema);
module.exports = Email;
