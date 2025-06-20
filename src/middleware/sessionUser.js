const session = require('express-session');

module.exports = (req, res, next) => {
	if (req.session && req.session.username) {
		res.locals.sessionUser = req.session.username;
		res.locals.sessionPhone = req.session.phone;
		res.locals.sessionEmail = req.session.email;
		res.locals.sessionAddress = req.session.address;
	} else {
		res.locals.sessionUser = null;
		res.locals.sessionPhone = null;
		res.locals.sessionEmail = null;
		res.locals.sessionAddress = null;
	}
	next();
};
