const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/User')

// Creacion de usuario
usersRouter.post('/', async (request, response) => {
  const { body } = request
  const { email, name, role, password, qualifications } = body
  // Tiene que haber una mejor manera de verificar esto
  if ((!email || !name || !role || !password) || (role === 'Teacher' && !qualifications) || (role !== 'Teacher' && role !== 'Student')) {
    response.status(400).json({ error: 'missing or invalid fields' })
    return
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    name,
    role,
    passwordHash
  })
  if (qualifications && role === 'Teacher') {
    user.qualifications = qualifications
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
    response.status(500).json(error)
  }
})

module.exports = usersRouter
