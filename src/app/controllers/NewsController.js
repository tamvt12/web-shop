const News = require('../models/News')
const Users = require('../models/User')
const multer = require('multer')
const path = require('path')

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/news')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({ storage: storage })

class NewsController {
  // Get all news articles
  async index(req, res, next) {
    try {
      const newsList = await News.find({}).lean()

      for (let newsItem of newsList) {
        const user = await Users.findById(newsItem.author, {
          name: 1,
          _id: 0,
        }).lean()
        newsItem.user_name = user ? user.name : ''
      }

      res.render('admin/news/index', { showAdmin: true, news: newsList })
    } catch (error) {
      next(error)
    }
  }

  // Show create form
  create(req, res) {
    res.render('admin/news/create', { showAdmin: true })
  }

  // Store new article
  store(req, res) {
    const { title, content, summary, image_url } = req.body

    try {
      const news = new News({
        title,
        content,
        summary,
        image_url,
        author: req.session.userId,
      })

      news.save()
      req.flash('success', 'Bài viết đã được tạo thành công!')
      res.redirect('/admin/news/list')
    } catch (error) {
      req.flash('error', 'Có lỗi xảy ra khi tạo bài viết!')
      res.redirect('/admin/news/add')
    }
  }

  // Show edit form
  async edit(req, res) {
    try {
      const news = await News.findById(req.params.id, {
        _id: 0,
        __v: 0,
      }).lean()
      res.render('admin/news/edit', {
        news,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load news.')
      res.redirect('/admin')
    }
  }

  // Update article
  async update(req, res) {
    const { title, content, summary, image_url } = req.body
    try {
      const updatedNews = await News.findByIdAndUpdate(req.params.id, {
        title,
        content,
        summary,
        image_url,
      })
      console.log(updatedNews)

      if (updatedNews) {
        res.redirect('/admin/news/list')
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
      await News.findByIdAndDelete(id)
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }

  // Show single article (for public view)
  async show(req, res) {
    try {
      const news = await News.findById(req.params.id).populate('author', 'name')

      if (!news) {
        return res.status(404).render('404')
      }

      res.render('news/show', { news })
    } catch (error) {
      res.status(500).render('404')
    }
  }

  // Get latest news (for homepage)
  async getLatestNews(req, res) {
    try {
      const latestNews = await News.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name')

      return latestNews
    } catch (error) {
      console.error('Error fetching latest news:', error)
      return []
    }
  }
}

module.exports = new NewsController()
