var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var HintboxSchema = new Schema({
    level: Number,
    hint: String,
});

HintboxSchema.statics.addHint = function (level, hint, callback) {
    var hb = new Hintbox({
        level: level,
        hint: hint,
    });
    hb.save(function (err) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, hb);
        }
    });
};

var Hintbox = mongoose.model("Hintbox", HintboxSchema);
module.exports = Hintbox;
