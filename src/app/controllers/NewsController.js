const NewsService = require('../services/NewsService')

class NewsController {
  // Get all news articles
  index = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1
      const perPage = 15
      const {
        newsList,
        currentPage,
        totalPages,
        pages,
      } = await NewsService.getPaginatedNews(page, perPage)

      res.render('admin/news/list', {
        showAdmin: true,
        news: newsList,
        currentPage,
        totalPages,
        pages,
      })
    } catch (error) {
      next(error)
    }
  }

  // Show create form
  create = (req, res) => {
    res.render('admin/news/add', { showAdmin: true, messages: req.flash() })
  }

  // Store new article
  store = async (req, res) => {
    const { title, content, summary, image_url } = req.body
    try {
      if (!title || !content || !summary) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        const referer = req.get('Referer')
        return res.redirect(referer)
      }
      await NewsService.createNews({
        title,
        content,
        summary,
        image_url,
        author: req.session.userId,
      })
      req.flash('success', 'Bài viết đã được tạo thành công!')
      res.redirect('/admin/news/list')
    } catch (error) {
      req.flash('error', 'Có lỗi xảy ra khi tạo bài viết!')
      res.redirect('/admin/news/add')
    }
  }

  // Show edit form
  edit = async (req, res) => {
    try {
      const news = await NewsService.getNewsById(req.params.id)
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
  update = async (req, res) => {
    const { title, content, summary, image_url } = req.body
    try {
      if (!title || !content || !summary) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        const referer = req.get('Referer')
        return res.redirect(referer)
      }
      const updatedNews = await NewsService.updateNews(req.params.id, {
        title,
        content,
        summary,
        image_url,
      })
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

  destroy = async (req, res) => {
    try {
      const id = req.params.id
      await NewsService.deleteNews(id)
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }

  showList = async (req, res, next) => {
    try {
      const newsList = await NewsService.getAllNewsWithUser()
      res.render('news', { newsList })
    } catch (error) {
      next(error)
    }
  }

  showDetail = async (req, res) => {
    try {
      const news = await NewsService.getNewsById(req.params.id)
      if (!news) {
        return res.status(404).render('404')
      }
      await NewsService.incrementViews(news.id)
      const plainNews = await NewsService.getNewsWithUserById(news.id)
      const relatedNews = await NewsService.getRelatedNews(news.id, 3)
      const excludeIds = [news.id, ...relatedNews.map((n) => n.id)]
      const latestNews = await NewsService.getLatestNews(excludeIds, 3)
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
