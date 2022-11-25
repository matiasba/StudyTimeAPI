const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/User')
const useAuthorization = require('../middleware/userAutorization')

// Devuelve los datos del usuario que lo llama
usersRouter.get('/', useAuthorization, (request, response, next) => {
  User.findById(request.userId)
    .then(course => {
      if (course) return response.json(course)
      response.status(404).end()
    })
    .catch(err => next(err))
})

// Creacion de usuario
usersRouter.post('/', async (request, response) => {
  const { body } = request
  const { email, name, role, password, phone, birthdate, education, titles, experience } = body
  const validEducation = ['Primario', 'Secundario', 'Terciario', 'Universitario']
  // Tiene que haber una mejor manera de verificar esto
  if ((!email || !name || !role || !password || !birthdate || !phone || !education) ||
  (role === 'Teacher' && !titles && !experience) ||
  (role !== 'Teacher' && role !== 'Student') ||
  (!validEducation.includes(education))
  ) {
    response.status(400).json({ error: 'missing or invalid fields' })
    return
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    name,
    role,
    birthdate,
    phone,
    passwordHash,
    education
  })
  if (role === 'Teacher') {
    user.titles = titles
    user.experience = experience
  }

  let error
  try {
    await user.save()
  } catch (err) {
    error = err
  }
  if (error == null) {
    response.status(201).json('created')
  } else {
    console.log(error)
    response.status(500).json(error)
  }
})

module.exports = usersRouter
