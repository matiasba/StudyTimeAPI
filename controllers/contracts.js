const contractsRouter = require('express').Router()
const User = require('../models/User')
const useAuthorization = require('../middleware/userAutorization')
const Course = require('../models/Course')
const Contract = require('../models/Contract')
const { sendMail } = require('./mail')

// Devuelve todos los contratos del estudiante o de un courso especifico si se la manda la query ?courseid=
contractsRouter.get('/:id', useAuthorization, (request, response, next) => {
  const { id } = request.params
  const filter = { $or: [{ studentid: request.userId }, { teacherid: request.userId }] }
  if (id && id !== 'undefined') {
    filter.courseid = id
  }
  if (request.query.courseid) {
    filter.courseid = request.query.courseid
  }
  Contract.find(filter).populate(['courseid', 'studentid', 'teacherid'])
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
  const update = { rating: rating }
  const validStates = ['Aceptada', 'Finalizada']

  Contract.findById(contractid)
    .then(contract => {
      if (!contract) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (!validStates.includes(contract.state)) {
          return response.status(403).json({ error: 'Contract state is not valid for rating' })
        }
        if (String(contract.studentid) !== userid) {
          return response.status(403).json({ error: 'User is not studentid of contract' })
        }
        Contract.findByIdAndUpdate(contractid, update, { new: true })
          .then(updatedContract => {
            Course.findById(updatedContract.courseid)
              .then(course => {
                let courseUpdate
                if (contract.rating) {
                  const newRating = (((course.rating[0] * course.rating[1]) - contract.rating) + rating) / course.rating[1]
                  courseUpdate = { rating: [newRating, course.rating[1]] }
                } else {
                  const newRatingCount = course.rating[1] + 1
                  const newRating = ((course.rating[0] * course.rating[1]) + rating) / newRatingCount
                  courseUpdate = { rating: [newRating, newRatingCount] }
                }
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
  const filter = { _id: contractid, studentid: userid }
  const update = { comment: { state: 'Pendiente', comment: comment } }
  const contractValidStates = ['Aceptada', 'Finalizada']

  Contract.findById(contractid)
    .then(contract => {
      if (!contract) {
        return response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (String(contract.studentid) !== userid) {
          return response.status(403).json({ error: 'User is not studentid of contract' })
        }
        if (!contractValidStates.includes(contract.state)) {
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
    state,
    razon
  } = request.body
  const userid = request.userId

  const bloquedMail = {
    from: process.env.MAIL_USERNAME + '@gmail.com',
    subject: 'StudyTime: Tu comentario fue bloqueado'
  }

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
        if (String(contract.teacherid) !== userid) {
          return response.status(403).json({ error: 'User is not owner of course' })
        } else {
          Contract.findByIdAndUpdate(contractid, update, { new: true })
            .then(updatedContract => {
              if (state === 'Bloqueado') {
                User.findById(updatedContract.studentid).then(user => {
                  bloquedMail.to = user.email
                  bloquedMail.text = `Su profesor a bloqueado el siguiente comentario: ${updatedContract.comment.comment} \nLa razon dada es: ${razon}`
                  sendMail(bloquedMail)
                })
              }
              response.status(200).json(updatedContract)
            }).catch(err => response.status(500).json(err))
        }
      }
    })
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
  const studentid = request.userId
  // Tiene que haber una mejor manera de verificar esto
  if (!courseid && !usercontactphone && !usercontactmail && !usercontacttime && !usermessage) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  // Verifica si el usuario que lo pidio es estudiante (otros NO deberian poder)
  User.findById(studentid)
    .then(user => {
      if (user.role !== 'Student') return response.status(403).json({ error: 'user is not Student role' })
      else {
        Contract.find({ studentid: studentid, courseid: courseid })
          .then(contract => {
            if (contract.length !== 0) return response.status(406).json({ error: 'Contract already exist' })
            else {
              Course.findById(courseid)
                .then(course => {
                  const newContract = new Contract({
                    studentid,
                    courseid,
                    usercontactphone,
                    usercontactmail,
                    usercontacttime,
                    usermessage,
                    state: 'Solicitada',
                    teacherid: course.ownedby,
                    date: new Date()
                  })
                  newContract.save().then(
                    savedContract => {
                      response.json(savedContract)
                    }).catch(error =>
                    response.status(400).json(error)
                  )
                }).catch(err => response.status(500).json(err))
            }
          })
          .catch(err => response.status(500).json(err))
      }
    })
    .catch(err => response.status(500).json(err))
})

// Actualiza el estado del contrato
// TODO: Mejorar la logica para que contemple el estado anterior
contractsRouter.put('/', useAuthorization, async (request, response) => {
  const { contractid, state } = request.body
  const userid = request.userId
  const validStatesTeacher = ['Aceptada', 'Finalizada', 'Cancelada']
  const validStatesStudent = ['Finalizada', 'Cancelada']

  Contract.findById(contractid)
    .then(contract => {
      if (!contract) {
        response.status(404).json({ error: 'Contract does not exist' })
      } else {
        if (String(contract.studentid) !== userid) {
          if (String(contract.teacherid) === userid) {
            if (!validStatesTeacher.includes(state)) {
              response.status(400).json({ error: 'invalid state' })
            } else {
              const filter = { _id: contractid }
              const update = { state: state }
              Contract.findOneAndUpdate(filter, update, { new: true })
                .then(updatedContract => {
                  response.status(200).json(updatedContract)
                }).catch(err => response.status(500).json(err))
            }
          } else {
            response.status(403).json({ error: 'user is not part of contract' })
          }
        } else {
          if (!validStatesStudent.includes(state)) {
            response.status(400).json({ error: 'invalid state' })
          } else {
            const filter = { _id: contractid }
            const update = { state: state }
            Contract.findOneAndUpdate(filter, update, { new: true })
              .then(updatedContract => {
                response.status(200).json(updatedContract)
              }).catch(err => response.status(500).json(err))
          }
        }
      }
    }).catch(err => response.status(500).json(err))
})

module.exports = contractsRouter
