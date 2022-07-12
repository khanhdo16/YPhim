const mongoose = require('mongoose')
const passportLocalMongoose = require ('passport-local-mongoose')
const validator = require("validator")

const imgurSchema = require('./Imgur')

const requiredMsg = 'Field {PATH} is required!'

//Schema for User
const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
        required: [true, requiredMsg]
    },
    lname: {
        type: String,
        trim: true,
        required: [true, requiredMsg]
    },
    username: {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
        unique: true,
        required: [true, requiredMsg]
    },
    password: {
        type: String,
        trim: true,
        required: [true, requiredMsg],
        validate: (value) => {
            if(!validator.isStrongPassword(value)) {
                throw new Error('Password is weak! Make sure it is at least 8 characters and contains: 1 upper, 1 lower, 1 number, 1 symbol.')
            }
        }
    },
    imgur: imgurSchema
})

userSchema.plugin(passportLocalMongoose, {
    errorMessages: {
        MissingUsernameError: 'Field username is required!',
        MissingPasswordError: 'Field password is required!',
        UserExistsError: 'This email has already been taken!',
        IncorrectUsernameError: 'Incorrect email or password.',
        IncorrectPasswordError: 'Incorrect email or password.'
    },
    usernameField: 'username',
    usernameCaseInsensitive: true,
    usernameLowerCase: true,
    hashField: 'password',
})


module.exports = mongoose.model("User", userSchema)