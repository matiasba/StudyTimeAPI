require('dotenv').config()
require('./mongo')

const express = require('express')
const app = express()
const cors = require('cors')
const Course = require('./models/Course')

const notFound = require('./middleware/notFound.js')
const handleErrors = require('./middleware/handleErrors.js')
const userExtractor = require('./middleware/userExtractor')

const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

app.use(cors())
app.use(express.json())
app.use('/images', express.static('images'))

app.get('/', (request, response) => {
  console.log(request.ip)
  console.log(request.ips)
  console.log(request.originalUrl)
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/courses', async (request, response) => {
  const courses = await Course.find({}).populate('user', {
    username: 1,
    name: 1
  })
  response.json(courses)
})

app.get('/api/courses/:id', (request, response, next) => {
  const { id } = request.params

  Course.findById(id)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

app.put('/api/courses/:id', userExtractor, (request, response, next) => {
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

app.delete('/api/courses/:id', userExtractor, async (request, response, next) => {
  const { id } = request.params

  const course = await Course.findByIdAndDelete(id)
  if (course === null) return response.sendStatus(404)

  response.status(204).end()
})

app.post('/api/courses', userExtractor, async (request, response, next) => {
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

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

app.use(notFound)
app.use(handleErrors)

const PORT = process.env.PORT || 3001
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, server }
