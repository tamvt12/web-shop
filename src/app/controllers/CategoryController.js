const Category = require('../models/Category')

class CategoryController {
  index(req, res, next) {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    Category.countDocuments({})
      .then(async (totalCategories) => {
        const totalPages = Math.ceil(totalCategories / perPage)
        const pages = []
        const maxPagesToShow = 5
        let startPage, endPage
        if (totalPages <= maxPagesToShow) {
          startPage = 1
          endPage = totalPages
        } else {
          const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
          const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
          if (page <= maxPagesBeforeCurrent) {
            startPage = 1
            endPage = maxPagesToShow
          } else if (page + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1
            endPage = totalPages
          } else {
            startPage = page - maxPagesBeforeCurrent
            endPage = page + maxPagesAfterCurrent
          }
        }
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }

        const categories = await Category.find({})
          .skip((page - 1) * perPage)
          .limit(perPage)
          .lean()
        res.render('admin/category/list', {
          showAdmin: true,
          categories,
          currentPage: page,
          totalPages,
          pages,
        })
      })
      .catch(next)
  }

  create(req, res) {
    res.render('admin/category/add', {
      showAdmin: true,
      messages: req.flash(),
    })
  }

  store(req, res) {
    const { name, image_url } = req.body
    try {
      if (name === '') {
        req.flash('error', 'Chưa nhập tên danh mục!!!')
        return res.redirect('/admin/category/add')
      }
      const category = new Category({
        name,
        image_url,
      })
      category.save()
      res.redirect('/admin/category/list')
    } catch (error) {
      req.flash('error', 'Thêm thất bại!!!')
      return res.redirect('/admin/category/add')
    }
  }

  async show(req, res) {
    try {
      const category = await Category.findOne(
        { id: req.params.id },
        {
          name: 1,
          _id: 0,
        },
      ).lean()
      res.render('admin/category/edit', {
        category,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load category.')
      res.redirect('/admin')
    }
  }

  async update(req, res) {
    const { name, image_url } = req.body
    const id = req.params.id
    try {
      if (name === '') {
        req.flash('error', 'Chưa nhập tên danh mục!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
      const updatedCategory = await Category.findOneAndUpdate(
        { id },
        {
          name,
          image_url,
        },
      )
      if (updatedCategory) {
        res.redirect('/admin/category/list')
      } else {
        req.flash('error', 'Cập nhập thất bại!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
    } catch (error) {
      req.flash('error', 'Cập nhập thất bại!!!')
      const referer = req.get('Referer')
      res.redirect(referer)
    }
  }

  async destroy(req, res) {
    try {
      const id = req.params.id
      await Category.findOneAndDelete({ id })
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }

  count(req, res) {
    Category.countDocuments()
      .then((count) => {
        res.json(count)
      })
      .catch((err) => {
        res.json(err)
      })
  }
}

module.exports = new CategoryController()
