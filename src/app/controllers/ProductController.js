const Product = require('../models/Product')
const Category = require('../models/Category')

class ProductController {
  index(req, res, next) {
    Product.find({})
      .lean()
      .then(async (products) => {
        for (let product of products) {
          const category = await Category.findOne(
            { id: product.category_id },
            {
              name: 1,
              _id: 0,
            },
          ).lean()
          product.category_name = category ? category.name : ''
          if (typeof product.image_url === 'string') {
            const imageArray = product.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            product.image_url = imageArray.length > 0 ? imageArray[0] : ''
          }
        }
        res.render('admin/product/list', { showAdmin: true, products })
        // res.json(products);
      })
      .catch(next)
  }

  create(req, res, next) {
    Category.find({})
      .lean()
      .then((categories) => {
        res.render('admin/product/add', {
          showAdmin: true,
          categories,
        })
      })
      .catch(next)
  }

  store(req, res) {
    const { category_id, name, description, price, stock, image_url } = req.body
    try {
      if (
        category_id === '' &&
        name === '' &&
        description === '' &&
        price === '' &&
        stock === '' &&
        image_url === ''
      ) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        return res.redirect('/admin/product/add')
      }

      const product = new Product({
        name,
        description,
        price,
        stock,
        category_id,
        image_url,
      })
      product.save()
      res.redirect('/admin/product/list')
    } catch (error) {
      req.flash('error', 'Thêm thất bại!!!')
      return res.redirect('/admin/product/add')
    }
  }

  async show(req, res) {
    try {
      const product = await Product.findOne(
        { id: req.params.id },
        {
          _id: 0,
          __v: 0,
        },
      ).lean()
      const category = await Category.findOne(
        { id: product.category_id },
        {
          name: 1,
          _id: 0,
        },
      ).lean()
      product.category_name = category ? category.name : ''

      // Convert image_url string to array
      if (typeof product.image_url === 'string') {
        const imageArray = product.image_url
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url !== '')
        product.image_url = imageArray
      }

      const categories = await Category.find({}).lean()
      res.render('admin/product/edit', {
        product,
        categories,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load product.')
      res.redirect('/admin')
    }
  }

  async update(req, res) {
    const { category_id, name, description, price, stock, image_url } = req.body
    const id = req.params.id
    try {
      if (
        category_id === '' &&
        name === '' &&
        description === '' &&
        price === '' &&
        stock === '' &&
        image_url === ''
      ) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
      const updatedProduct = await Product.findOneAndUpdate(
        { id },
        {
          name,
          description,
          price,
          stock,
          category_id,
          image_url,
        },
      )
      if (updatedProduct) {
        res.redirect('/admin/product/list')
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
      await Product.findOneAndDelete({ id })
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }
}

module.exports = new ProductController()
