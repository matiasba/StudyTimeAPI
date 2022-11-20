const Course = require('../models/Course')
const useAuthorization = require('../middleware/userAutorization')
const coursesRouter = require('express').Router()

coursesRouter.get('/', (request, response, next) => {
  Course.find()
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

coursesRouter.get('/filter', (request, response, next) => {
  const filter = `{"name": { "$regex": ".*${request.query.name || ''}.*", "$options": "i" },"type": { "$regex": ".*${request.query.type || ''}.*", "$options": "i" }}`
  Course.find(JSON.parse(filter)).sort(request.query.orderBy).limit(request.query.limit)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Devuelve contenido del curso por ID
coursesRouter.get('/:id', (request, response, next) => {
  const { id } = request.params

  Course.findById(id)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Modifica contenido del curso por ID
coursesRouter.put('/:id', useAuthorization, (request, response, next) => {
  const { id } = request.params
  const course = request.body

  const newCourseInfo = {
    description: course.description,
    name: course.name,
    type: course.type
  }

  Course.findByIdAndUpdate(id, newCourseInfo, { new: true })
    .then(result => {
      response.json(result)
    })
    .catch(next)
})

// Borra curso por ID
coursesRouter.delete('/:id', useAuthorization, async (request, response, next) => {
  const { id } = request.params

  const course = await Course.findByIdAndDelete(id)
  if (course === null) return response.sendStatus(404)
  response.status(204).end()
})
// Crea nuevo curso
coursesRouter.post('/', useAuthorization, async (request, response, next) => {
  const {
    name,
    description,
    type
  } = request.body

  if (!description && !name) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  const newCourse = new Course({
    name,
    description,
    date: new Date(),
    type: type,
    raiting: [0, 0],
    ownedBy: request.userId
  })

  try {
    const savedCourse = await newCourse.save()
    response.json(savedCourse)
  } catch (error) {
    next(error)
  }
})

module.exports = coursesRouter
