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
  const filter = `{"name": { "$regex": ".*${request.query.name || ''}.*", "$options": "i" },"type": { "$regex": ".*${request.query.type || ''}.*", "$options": "i" },"state": "Publicado"}`
  Course.find(JSON.parse(filter)).sort(request.query.orderBy).limit(request.query.limit)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Devuelve cursos del profesor que lo solicite //Anda joya
coursesRouter.get('/fromTeacher', useAuthorization, (request, response, next) => {
  Course.find({ ownedby: request.userId })
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

// Modifica contenido del curso por ID //Anda joya,  TODO: Validar que el curso pertenezca al usuario que mando el post
coursesRouter.put('/:id', useAuthorization, (request, response, next) => {
  const { id } = request.params
  const course = request.body
  const userid = request.userId

  const newCourseInfo = {
    name: course.name,
    description: course.description,
    periodicity: course.periodicity,
    cost: course.cost,
    state: course.state
  }

  Course.findById(id)
    .then(course => {
      if (!course) {
        return response.status(404).json({ error: 'Course does not exist' })
      } else {
        if (String(course.ownedby) !== userid) {
          return response.status(403).json({ error: 'Course does not belong to user' })
        } else {
          Course.findByIdAndUpdate(id, newCourseInfo, { new: true })
            .then(status => {
              return response.status(200).json(status)
            }).catch(err => response.status(500).json(err))
        }
      }
    }).catch(err => response.status(500).json(err))
})

// Borra curso por ID
// No se usa
coursesRouter.delete('/:id', useAuthorization, async (request, response) => {
  const { id } = request.params
  const userid = request.userId

  Course.findById(id)
    .then(course => {
      if (!course) {
        return response.status(404).json({ error: 'Course does not exist' })
      } else {
        if (String(course.ownedby) !== userid) {
          return response.status(403).json({ error: 'Course does not belong to user' })
        } else {
          Course.findByIdAndDelete(id)
            .then(status => {
              return response.status(200).json({ error: 'Course deleted' })
            }).catch(err => response.status(500).json(err))
        }
      }
    }).catch(err => response.status(500).json(err))
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
  const splitTypes = type.split(',')

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
    type: splitTypes,
    rating: [0, 0],
    ownedby: request.userId
  })

  try {
    const savedCourse = await newCourse.save()
    response.json(savedCourse)
  } catch (error) {
    response.status(400).json(error)
  }
})

module.exports = coursesRouter
