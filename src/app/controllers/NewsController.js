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
      const page = parseInt(req.query.page) || 1
      const perPage = 15
      const totalNews = await News.countDocuments({})
      const totalPages = Math.ceil(totalNews / perPage)

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

      const newsList = await News.find({})
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()

      for (let newsItem of newsList) {
        const user = await Users.findOne(
          { id: newsItem.author },
          {
            name: 1,
            _id: 0,
          },
        ).lean()
        newsItem.user_name = user ? user.name : ''
      }

      res.render('admin/news/list', {
        showAdmin: true,
        news: newsList,
        currentPage: page,
        totalPages,
        pages,
      })
    } catch (error) {
      next(error)
    }
  }

  // Show create form
  create(req, res) {
    res.render('admin/news/add', { showAdmin: true })
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
      const news = await News.findOne(
        { id: req.params.id },
        {
          _id: 0,
          __v: 0,
        },
      ).lean()
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
      const updatedNews = await News.findOneAndUpdate(
        { id: req.params.id },
        {
          title,
          content,
          summary,
          image_url,
        },
      )
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
      await News.findOneAndDelete({ id })
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }

  async showList(req, res) {
    try {
      const newsList = await News.find({}).sort({ createdAt: -1 }).lean()
      for (let newsItem of newsList) {
        const user = await Users.findOne(
          { id: newsItem.author },
          {
            name: 1,
            _id: 0,
          },
        ).lean()
        newsItem.user_name = user ? user.name : ''
      }
      res.render('news', { newsList })
    } catch (error) {
      next(error)
    }
  }

  async showDetail(req, res) {
    try {
      const news = await News.findOne({ id: req.params.id })
      if (!news) {
        return res.status(404).render('404')
      }

      news.views = (news.views || 0) + 1
      await news.save()

      const user = await Users.findOne(
        { id: news.author },
        {
          name: 1,
          _id: 0,
        },
      ).lean()

      const relatedNews = await News.find({ id: { $ne: news.id } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()

      const excludeIds = [news.id, ...relatedNews.map((n) => n.id)]

      const latestNews = await News.find({ id: { $nin: excludeIds } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()

      const plainNews = news.toObject()
      plainNews.user_name = user ? user.name : ''

      res.render('news-detail', {
        new: plainNews,
        relatedNews,
        latestNews,
      })
    } catch (error) {
      res.status(500).render('404')
    }
  }
}

module.exports = new NewsController()
