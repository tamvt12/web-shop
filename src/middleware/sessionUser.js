const session = require('express-session')

module.exports = (req, res, next) => {
  if (req.session && req.session.username) {
    res.locals.sessionUserID = req.session.userID
    res.locals.sessionUserCode = req.session.userCode
    res.locals.sessionUser = req.session.username
    res.locals.sessionFullName = req.session.fullName
    res.locals.sessionGender = req.session.gender
    res.locals.sessionBirthDate = req.session.birthDate
    res.locals.sessionPhone = req.session.phone
    res.locals.sessionEmail = req.session.email
    res.locals.sessionAddress = req.session.address
  } else {
    res.locals.sessionUserCode = null
    res.locals.sessionUser = null
    res.locals.sessionFullName = null
    res.locals.sessionGender = null
    res.locals.sessionBirthDate = null
    res.locals.sessionPhone = null
    res.locals.sessionEmail = null
    res.locals.sessionAddress = null
  }
  next()
}
