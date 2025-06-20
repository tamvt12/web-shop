const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {
	async index(req, res) {
		try {
			const users = await User.find({});
			res.json(users);
		} catch (error) {
			res.status(400).json({ err: 'ERROR!!!' });
		}
	}

	showLogin(req, res) {
		res.render('login', { showLogin: true, messages: req.flash() });
	}

	showRegister(req, res) {
		res.render('register', { showLogin: true, messages: req.flash() });
	}

	async register(req, res) {
		const { name, email, password, repeatPassword } = req.body;

		if (name === '' || email === '' || password === '') {
			req.flash('error', 'Chưa nhập name, email hoặc mật khẩu!!!');
			return res.redirect('/register');
		}

		if (password.length < 6) {
			req.flash('error', 'Mật khẩu phải có độ dài ít nhất 6 ký tự!!!');
			return res.redirect('/register');
		}

		if (password !== repeatPassword) {
			req.flash('error', 'Nhập lại mật khẩu không khớp!!!');
			return res.redirect('/register');
		}

		try {
			const existingUser = await User.findOne({ email });

			if (existingUser) {
				req.flash('error', 'Email đã được sử dụng!!!');
				return res.redirect('/register');
			}
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = new User({
				name,
				email,
				password: hashedPassword,
			});

			await user.save();
			res.redirect('login');
		} catch (error) {
			req.flash('error', 'Đăng ký tài khoản thất bại!!!');
			return res.redirect('/register');
		}
	}

	async login(req, res) {
		const { email, password } = req.body;

		if (email === '' || password === '') {
			req.flash('error', 'Chưa nhập email hoặc mật khẩu!!!');
			return res.redirect('/login');
		}

		try {
			const user = await User.findOne({ email });

			if (!user) {
				req.flash('error', 'Tài khoản không tồn tại!!!');
				return res.redirect('/login');
			}

			const isPasswordValid = await bcrypt.compare(
				password,
				user.password
			);

			if (!isPasswordValid) {
				req.flash('error', 'Sai mật khẩu!!!');
				return res.redirect('/login');
			}

			const token = jwt.sign({ id: user._id }, 'your_secret_key', {
				expiresIn: '1h',
			});
			req.session.userId = user._id;
			req.session.username = user.name;
			req.session.phone = user.phone;
			req.session.email = user.email;
			req.session.address = user.address;
			req.session.token = token;
			req.session.role = user.role;
			if (user.role === 'admin') {
				res.redirect('/admin');
			} else {
				res.redirect('/');
			}
		} catch (error) {
			req.flash('error', 'Đăng nhập thất bại!!!');
			return res.redirect('/login');
		}
	}

	logout(req, res) {
		req.session.destroy((err) => {
			if (err) {
				return res.redirect('/');
			}

			res.clearCookie('connect.sid'); // Clear the session cookie
			res.redirect('/login');
		});
	}

	update = async (req, res) => {
		const { email, phone, address } = req.body;

		try {
			if (phone && !this.isPhoneNumber(phone)) {
				return res.json({
					success: false,
					message: 'Số điện thoại không hợp lệ.',
				});
			}
			const updatedUser = await User.findOneAndUpdate(
				{ email },
				{ phone, address },
				{ new: true }
			);

			if (updatedUser) {
				req.session.phone = updatedUser.phone;
				req.session.address = updatedUser.address;

				return res.json({
					success: true,
					message: 'Cập nhật thành công.',
				});
			} else {
				return res.json({
					success: false,
					message: 'Không tìm thấy người dùng.',
				});
			}
		} catch (error) {
			return res.json({
				success: false,
				message: 'Có lỗi xảy ra khi cập nhật.',
			});
		}
	};

	isPhoneNumber(phone) {
		const phoneRegex = /^0[0-9]{9,10}$/;
		return phoneRegex.test(phone);
	}
}

module.exports = new UserController();
