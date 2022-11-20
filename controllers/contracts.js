const coursesRouter = require('express').Router()
const User = require('../models/User')
const useAuthorization = require('../middleware/userAutorization')
const Course = require('../models/Course')

// Devuelve todos los contratos del usuario //TODO
coursesRouter.get('/', useAuthorization, async (request, response) => {
  const users = await User.find({}).populate('users', {
    content: 1,
    date: 1
  })
  response.json(users)
})

// Creacion de contratos
coursesRouter.post('/', useAuthorization, async (request, response, next) => {
  const { body } = request
  const { courseId } = body

  Course.find({ courseId })
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))

  const filter = { _id: request.userId }
  const update = { Courses: courseId }

  let error
  try {
    User.findOneAndUpdate(filter, update, {
      new: true
    })
  } catch (err) {
    error = err
  }
  if (error == null) {
    response.status(201).json('created')
  } else {
    response.status(400).json(error)
  }
})

module.exports = coursesRouter
