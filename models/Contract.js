const { Schema, model } = require('mongoose')

const contractSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  courseid: {
    type: Schema.Types.ObjectId,
    ref: 'Courses',
    required: true
  },
  usercontactphone: {
    type: String,
    required: true
  },
  usercontactmail: {
    type: String,
    required: true
  },
  usercontacttime: {
    type: String,
    required: true
  },
  usermessage: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  comments: {
    type: {
      state: {
        type: String
      },
      comment: {
        type: String
      }
    }
  },
  rating: Number,
  date: Date
})

contractSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Contract = model('Contract', contractSchema)

module.exports = Contract
