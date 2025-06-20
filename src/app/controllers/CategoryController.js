const Category = require('../models/Category');

class CategoryController {
	index(req, res, next) {
		Category.find({})
			.lean()
			.then((categories) => {
				res.render('admin/category/list', {
					showAdmin: true,
					categories,
				});
			})
			.catch(next);
	}

	create(req, res) {
		res.render('admin/category/add', {
			showAdmin: true,
			messages: req.flash(),
		});
	}

	store(req, res) {
		const name = req.body.name;
		try {
			if (name === '') {
				req.flash('error', 'Chưa nhập tên danh mục!!!');
				return res.redirect('/admin/category/add');
			}
			const category = new Category({
				name,
			});
			category.save();
			res.redirect('/admin/category/list');
		} catch (error) {
			req.flash('error', 'Thêm thất bại!!!');
			return res.redirect('/admin/category/add');
		}
	}

	async show(req, res) {
		try {
			const category = await Category.findById(req.params.id, {
				name: 1,
				_id: 0,
			}).lean();
			res.render('admin/category/edit', {
				category,
				showAdmin: true,
				messages: req.flash(),
			});
		} catch (error) {
			req.flash('error', 'Failed to load category.');
			res.redirect('/admin');
		}
	}

	async update(req, res) {
		const { name } = req.body;
		const id = req.params.id;
		try {
			if (name === '') {
				req.flash('error', 'Chưa nhập tên danh mục!!!');
				const referer = req.get('Referer');
				res.redirect(referer);
			}
			const updatedCategory = await Category.findByIdAndUpdate(id, {
				name,
			});
			if (updatedCategory) {
				res.redirect('/admin/category/list');
			} else {
				req.flash('error', 'Cập nhập thất bại!!!');
				const referer = req.get('Referer');
				res.redirect(referer);
			}
		} catch (error) {
			req.flash('error', 'Cập nhập thất bại!!!');
			const referer = req.get('Referer');
			res.redirect(referer);
		}
	}

	async destroy(req, res) {
		try {
			const id = req.params.id;
			await Category.findByIdAndDelete(id);
			res.json({ success: true, message: 'Xóa thành công' });
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Có lỗi xảy ra khi xóa',
			});
		}
	}

	count(req, res) {
		Category.countDocuments()
			.then((count) => {
				res.json(count);
			})
			.catch((err) => {
				res.json(err);
			});
	}
}

module.exports = new CategoryController();
