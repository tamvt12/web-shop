const News = require('../models/News')
const AdminService = require('./AdminService')
const { getFirstImage, getUserNameById } = require('../helpers/dataHelpers')

class NewsService {
  getPaginatedNews = async (page = 1, perPage = 15) => {
    const totalNews = await News.countDocuments({})
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalNews,
      page,
      perPage,
    )

    const newsList = await News.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()

    await Promise.all(
      newsList.map(async (newsItem) => {
        newsItem.user_name = await getUserNameById(newsItem.author)
        newsItem.image_url = getFirstImage(newsItem.image_url)
      }),
    )

    return { newsList, currentPage: page, totalPages, pages }
  }

  getAllNewsWithUser = async () => {
    const newsList = await News.find({}).sort({ created_at: -1 }).lean()
    await Promise.all(
      newsList.map(async (newsItem) => {
        newsItem.user_name = await getUserNameById(newsItem.author)
        newsItem.image_url = getFirstImage(newsItem.image_url)
      }),
    )
    return newsList
  }

  getNewsById = async (id) => {
    return await News.findOne(
      { id },
      {
        _id: 0,
        __v: 0,
      },
    ).lean()
  }

  getNewsWithUserById = async (id) => {
    const news = await News.findOne({ id })
    if (!news) return null
    const plainNews = news.toObject()
    plainNews.user_name = await getUserNameById(news.author)
    plainNews.image_url = getFirstImage(news.image_url)
    return plainNews
  }

  getRelatedNews = async (newsId, limit = 3) => {
    const related = await News.find({ id: { $ne: newsId } })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
    await Promise.all(
      related.map(async (newsItem) => {
        newsItem.user_name = await getUserNameById(newsItem.author)
        newsItem.image_url = getFirstImage(newsItem.image_url)
      }),
    )
    return related
  }

  getLatestNews = async (excludeIds, limit = 3) => {
    const latest = await News.find({ id: { $nin: excludeIds } })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
    await Promise.all(
      latest.map(async (newsItem) => {
        newsItem.user_name = await getUserNameById(newsItem.author)
        newsItem.image_url = getFirstImage(newsItem.image_url)
      }),
    )
    return latest
  }

  createNews = async ({ title, content, summary, image_url, author }) => {
    const news = new News({
      title,
      content,
      summary,
      image_url,
      author,
    })
    await news.save()
    return news
  }

  updateNews = async (id, { title, content, summary, image_url }) => {
    return await News.findOneAndUpdate(
      { id },
      {
        title,
        content,
        summary,
        image_url,
        updated_at: new Date(),
      },
    )
  }

  deleteNews = async (id) => {
    return await News.findOneAndDelete({ id })
  }

  incrementViews = async (id) => {
    const news = await News.findOne({ id })
    if (news) {
      news.views = (news.views || 0) + 1
      await news.save()
    }
    return news
  }
}

module.exports = new NewsService()
