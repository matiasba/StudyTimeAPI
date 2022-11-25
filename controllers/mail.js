const nodemailer = require('nodemailer')

const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
})

function sendMail (mailDetails) {
  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log('Error Occurs ' + err)
    } else {
      console.log('Email sent successfully: ' + data)
    }
  })
}

module.exports = { sendMail }
