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

// Modifica el rating del contrato
contractsRouter.post('/applyRating', useAuthorization, (request, response, next) => {
  const {
    contractid,
    rating
  } = request.body
  const userid = request.userId
  if (!contractid || !rating) {
    return response.status(404).json({ error: 'Missing arguments' })
  }
  if (rating < 0 || rating > 5) {
    return response.status(404).json({ error: 'Rating value is invalid' })
  }
  const filter = { _id: contractid, userid: userid }
  const update = { rating: rating }
  const validStates = ['Aceptado', 'Finalizado']

  Contract.find(filter)
    .then(course => {
      if (course.length === 0) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (course[0].rating) {
          return response.status(403).json({ error: 'Contract already rated' })
        }
        if (!validStates.includes(course[0].state)) {
          return response.status(403).json({ error: 'Contract state is not valid for rating' })
        }
        Contract.findByIdAndUpdate(contractid, update, { new: true })
          .then(updatedContract => {
            Course.findById(updatedContract.courseid)
              .then(course => {
                const newRatingCount = course.rating[1] + 1
                const newRating = ((course.rating[0] * course.rating[1]) + rating) / newRatingCount
                const courseUpdate = { rating: [newRating, newRatingCount] }
                Course.findByIdAndUpdate(updatedContract.courseid, courseUpdate, { new: true })
                  .then(
                    response.status(200).json(updatedContract)
                  ).catch(err => response.status(500).json(err))
              }).catch(err => response.status(500).json(err))
          }).catch(err => response.status(500).json(err))
      }
    }).catch(err => response.status(500).json(err))
})

// Aplica o modifica commentario en curso
// El comentario siempre queda en estado "Pendiente" hasta que el profesor lo autorice
contractsRouter.post('/comment', useAuthorization, (request, response) => {
  const {
    contractid,
    comment
  } = request.body
  const userid = request.userId
  if (!contractid || !comment) {
    return response.status(404).json({ error: 'Missing arguments' })
  }
  const filter = { _id: contractid, userid: userid }
  const update = { comment: { state: 'Pendiente', comment: comment } }
  const validStates = ['Aceptado', 'Finalizado']

  Contract.findById(contractid)
    .then(contract => {
      if (!contract) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (String(contract.userid) !== userid) {
          return response.status(403).json({ error: 'User is not owner of contract' })
        }
        if (!validStates.includes(contract.state)) {
          return response.status(403).json({ error: 'Contract state is not valid for comment' })
        }
        Contract.findOneAndUpdate(filter, update, { new: true })
          .then(updatedContract => {
            response.status(200).json(updatedContract)
          }).catch(err => response.status(500).json(err))
      }
    })
})

// Permite modificar el estado de un comentario por el profesor owner del curso
contractsRouter.put('/moderateComment', useAuthorization, (request, response) => {
  const validStates = ['Bloqueado', 'Aceptado']
  const {
    contractid,
    state
  } = request.body
  const userid = request.userId

  if (!contractid || !state) {
    return response.status(404).json({ error: 'Missing arguments' })
  }
  if (!validStates.includes(state)) {
    return response.status(403).json({ error: 'New state is invalid' })
  }

  Contract.findById(contractid)
    .then(contract => {
      if (!contract) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        const update = { comment: { state: state, comment: contract.comment.comment } }
        Course.findById(contract.courseid).then(course => {
          if (String(course.ownedby) !== userid) {
            return response.status(403).json({ error: 'User is not owner of course' })
          } else {
            Contract.findByIdAndUpdate(contractid, update, { new: true })
              .then(updatedContract => {
                response.status(200).json(updatedContract)
              }).catch(err => response.status(500).json(err))
          }
        }).catch(err => response.status(500).json(err))
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
