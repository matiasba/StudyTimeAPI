const contractsRouter = require('express').Router()
const User = require('../models/User')
const useAuthorization = require('../middleware/userAutorization')
const Course = require('../models/Course')
const Contract = require('../models/Contract')

// Devuelve todos los contratos del estudiante o de un courso especifico si se la manda la query ?courseid=
contractsRouter.get('/studentContracts', useAuthorization, (request, response, next) => {
  const filter = { userid: request.userId }
  if (request.query.courseid) {
    filter.courseid = request.query.courseid
  }
  Contract.find(filter)
    .then(course => {
      if (course) return response.json(course)
    })
    .catch(err => next(err))
})

// Modifica el raiting del contrato
contractsRouter.post('/applyRaiting', useAuthorization, (request, response, next) => {
  const {
    contractid,
    raiting
  } = request.body
  const userid = request.userId
  const filter = { _id: contractid, userid: userid }
  const update = { raiting: raiting }

  Contract.find(filter)
    .then(course => {
      if (course.length === 0) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (course[0].rating) {
          return response.status(403).json({ error: 'Contract already rated' })
        } else {
          Contract.findOneAndUpdate(filter, update, { new: true })
            .then(updatedContract => {
              response.status(200).json(updatedContract)
            }).catch(err => response.status(500).json(err))
        }
      }
    })
})

// Devuelve todos los contratos del estudiante
// TODO
contractsRouter.get('/teacherContracts', useAuthorization, (request, response, next) => {
  Contract.find({ userid: request.userId })
    .then(course => {
      if (course) return response.json(course)
    })
    .catch(err => next(err))
})

// Creacion de contratos (verifica si existe antes)
contractsRouter.post('/', useAuthorization, async (request, response) => {
  const {
    courseid,
    usercontactphone,
    usercontactmail,
    usercontacttime,
    usermessage
  } = request.body
  const userid = request.userId
  // Tiene que haber una mejor manera de verificar esto
  if (!courseid && !usercontactphone && !usercontactmail && !usercontacttime && !usermessage) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  // Verifica si el usuario que lo pidio es estudiante (otros NO deberian poder)
  User.find({ _id: userid })
    .then(user => {
      if (user[0].role !== 'Student') return response.status(403).json({ Error: 'user is not Student role' })
      else {
        Contract.find({ userid: userid, courseid: courseid })
          .then(course => {
            if (course.length !== 0) return response.status(406).json({ Error: 'Contract already exist' })
            else {
              const newContract = new Contract({
                userid,
                courseid,
                usercontactphone,
                usercontactmail,
                usercontacttime,
                usermessage,
                state: 'Solicitado',
                date: new Date()
              })

              newContract.save().then(
                savedContract => {
                  response.json(savedContract)
                }).catch(error =>
                response.status(400).json(error)
              )
            }
          })
          .catch(err => response.status(500).json(err))
      }
    })
    .catch(err => response.status(500).json(err))
})

// Actualiza el estado del contrato
// TODO: Deberia verificar que el que modifico el contrato sea el profesor o el usuario que lo creo
contractsRouter.put('/', useAuthorization, async (request, response) => {
  const { contractid, state } = request.body
  const validStates = ['Aceptado', 'Finalizado', 'Cancelado']
  if (!validStates.includes(state)) {
    response.status(400).json({ error: 'invalid state' })
  } else {
    const filter = { _id: contractid }
    const update = { state: state }

    Contract.findOneAndUpdate(filter, update, { new: true })
      .then(updatedContract => {
        response.status(200).json(updatedContract)
      }).catch(err => response.status(500).json(err))
  }
})

module.exports = contractsRouter
