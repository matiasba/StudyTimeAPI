const { Schema, model } = require('mongoose')

const courseSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: Date,
  imageId: String,
  raiting: [Number, Number],
  type: {
    type: [String],
    required: true
  },
  ownedBy: {
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
