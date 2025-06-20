const checkLoggedIn = (req, res, next) => {
	if (req.session.userId || req.session.token) {
		// Kiểm tra session hoặc token
		next(); // Nếu đã đăng nhập, cho phép đi tiếp
	} else {
		res.redirect('/login'); // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
	}
};

const checkAdmin = (req, res, next) => {
	if (req.session.role === 'admin') {
		next();
	} else if (req.session.role === 'user') {
		res.redirect('/');
	} else {
		res.render('404');
	}
};

module.exports = { checkLoggedIn, checkAdmin };
