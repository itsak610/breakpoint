var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
    //global
    username: String,
    password: String,
    schoolname: String,
    type: String,
    verification: String,
    verified: {
        type: Boolean,
        default: false
    },
    time: {
        type: Date,
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
    student: {
        type: Boolean,
        default: false
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
    substitute:{
        type: Boolean,
        default: false
    },
    password1: {
        type: String,
        default: ''
    }

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
