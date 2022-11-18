const { Schema, model } = require('mongoose')

const courseSchema = new Schema({
  description: String,
  name: String,
  date: Date,
  imageId: String,
  raiting: Number
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
