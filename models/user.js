var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
    //global
    username: String,
    password: String,
    schoolname: String,
    type: String,
    verified: {
        type: Boolean,
        default: false
    },

    //school
    teachername: {
        type: String,
        default: ''
    },
    teachernumber: {
        type: String,
        default: ''
    },
    schoolemail: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },

    //student
    studentname: {
        type: String,
        default: ''
    },
    studentevent: {
        type: String,
        default: ''
    },
    studentemail: {
        type: String,
        default: ''
    },
    studentnumber: {
        type: String,
        default: ''
    },

    //participant
    participantname: {
        type: String,
        default: ''
    },
    participantevent: {
        type: String,
        default: ''
    },
    participantemail: {
        type: String,
        default: ''
    },
    participantnumber: {
        type: String,
        default: ''
    },
    password1: {
        type: String,
        default: ''
    }

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
