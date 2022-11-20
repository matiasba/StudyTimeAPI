const Course = require('../models/Course')
const useAuthorization = require('../middleware/userAutorization')
const coursesRouter = require('express').Router()

// Devuelve todos los cursos //Anda joya, no se usa en el front pero sirve para debuggear
coursesRouter.get('/', (request, response, next) => {
  Course.find()
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Devuelve cursos aplicando filtros ordenado y limites //Anda joya
coursesRouter.get('/filter', (request, response, next) => {
  const filter = `{"name": { "$regex": ".*${request.query.name || ''}.*", "$options": "i" },"type": { "$regex": ".*${request.query.type || ''}.*", "$options": "i" }}`
  Course.find(JSON.parse(filter)).sort(request.query.orderBy).limit(request.query.limit)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Devuelve cursos del profesor que lo solicite //Anda joya
coursesRouter.get('/fromTeacher', useAuthorization, (request, response, next) => {
  Course.find({ ownedBy: request.userId })
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Devuelve contenido del curso por ID //Anda joya
coursesRouter.get('/:id', (request, response, next) => {
  const { id } = request.params

  Course.findById(id)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Modifica contenido del curso por ID //Anda joya
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

// Borra curso por ID //Sin probar
coursesRouter.delete('/:id', useAuthorization, async (request, response, next) => {
  const { id } = request.params

  const course = await Course.findByIdAndDelete(id)
  if (course === null) return response.sendStatus(404)
  response.status(204).end()
})
// Crea nuevo curso //Anda joya
coursesRouter.post('/', useAuthorization, async (request, response) => {
  const {
    name,
    description,
    cost,
    periodicity,
    type,
    state
  } = request.body

  // Tiene que haber una mejor manera de verificar esto
  if (!description && !name && !description && !cost && !periodicity && !type && !state) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  const newCourse = new Course({
    name,
    description,
    state,
    cost,
    periodicity,
    date: new Date(),
    type: type,
    raiting: [0, 0],
    ownedBy: request.userId
  })

  try {
    const savedCourse = await newCourse.save()
    response.json(savedCourse)
  } catch (error) {
    response.status(400).json(error)
  }
})

module.exports = coursesRouter
