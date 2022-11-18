const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/User')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('users', {
    content: 1,
    date: 1
  })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { body } = request
  const { username, name, role, password } = body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    role,
    passwordHash
  })

  let error
  try {
    await user.save()
  } catch (err) {
    error = err
  }
  if (error == null) {
    response.status(201).json('created')
  } else {
    response.status(400).json(error)
  }
})

module.exports = usersRouter
