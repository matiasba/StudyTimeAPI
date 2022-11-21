const { Schema, model } = require('mongoose')

const courseSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cost: {
    type: String,
    required: true
  },
  periodicity: {
    type: String,
    required: true
  },
  type: {
    type: [String],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  comments: {
    type: [{
      ownedby: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
      },
      state: {
        type: String
      },
      comment: {
        type: String
      }
    }]
  },
  date: Date,
  raiting: [Number, Number],
  ownedby: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  }
})

courseSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Course = model('Course', courseSchema)

module.exports = Course
