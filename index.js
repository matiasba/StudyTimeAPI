require('dotenv').config()
require('./mongo')

const express = require('express')
const app = express()
const cors = require('cors')

const notFound = require('./middleware/notFound.js')
const handleErrors = require('./middleware/handleErrors.js')

const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const coursesRouter = require('./controllers/courses')

app.use(cors())
app.use(express.json())
app.use('/images', express.static('images'))

app.get('/', (request, response) => {
  console.log(request.ip)
  console.log(request.ips)
  console.log(request.originalUrl)
  response.send('<h1>Esto es una api, mira la docu</h1>')
})

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/courses', coursesRouter)

app.use(notFound)
app.use(handleErrors)

const PORT = process.env.PORT || 3001
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, server }
