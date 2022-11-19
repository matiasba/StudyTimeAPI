const Course = require('./models/Course')
const useAuthorization = require('./middleware/userAutorization')
const coursesRouter = require('express').Router()

coursesRouter.get('/api/courses', async (request, response) => {
  const courses = await Course.find({}).populate('user', {
    username: 1,
    name: 1
  })
  response.json(courses)
})

coursesRouter.get('/api/courses/:id', (request, response, next) => {
  const { id } = request.params

  Course.findById(id)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

coursesRouter.put('/api/courses/:id', useAuthorization, (request, response, next) => {
  const { id } = request.params
  const course = request.body

  const newCourseInfo = {
    description: course.description,
    name: course.name
  }

  Course.findByIdAndUpdate(id, newCourseInfo, { new: true })
    .then(result => {
      response.json(result)
    })
    .catch(next)
})

coursesRouter.delete('/api/courses/:id', useAuthorization, async (request, response, next) => {
  const { id } = request.params

  const course = await Course.findByIdAndDelete(id)
  if (course === null) return response.sendStatus(404)
  response.status(204).end()
})

coursesRouter.post('/api/courses', useAuthorization, async (request, response, next) => {
  const {
    name,
    description
  } = request.body

  if (!description && !name) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  const newCourse = new Course({
    name,
    description,
    date: new Date()
  })

  // newNote.save().then(savedNote => {
  //   response.json(savedNote)
  // }).catch(err => next(err))

  try {
    const savedCourse = await newCourse.save()
    response.json(savedCourse)
  } catch (error) {
    next(error)
  }
})
