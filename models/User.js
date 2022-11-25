const { Schema, model } = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  titles: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  birthdate: {
    type: Date,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  experience: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  }
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v

    delete returnedObject.passwordHash
  }
})

userSchema.plugin(uniqueValidator)
module.exports = model('User', userSchema)
