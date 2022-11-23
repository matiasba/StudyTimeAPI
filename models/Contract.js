const { Schema, model } = require('mongoose')

const contractSchema = new Schema({
  studentid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseid: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacherid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  comment: {
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

module.exports = model('Contract', contractSchema)
