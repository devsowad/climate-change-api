import { redisClient } from '@/lib/redis';
import { REDIS_EXPIRATION_TIME } from '@/utils/constants';
import { newspapers } from '@/utils/newspapers';
import axios from 'axios';
import cheerio from 'cheerio';
import { Router } from 'express';

const router = Router();

export interface Article {
  title: string;
  url: string | undefined;
  source: string;
}

router.get('/', async (req, res) => {
  const ignoreCache = req.query.ignoreCache;
  try {
    const news = ignoreCache === 'true' ? null : await redisClient.get('news');
    if (news) {
      res.json({
        status: 'success',
        message: 'News fetched from cache',
        data: JSON.parse(news),
      });
    } else {
      const articles: Article[] = [];
      for (let i = 0; i < newspapers.length; i++) {
        const data = await loadNews(newspapers[i]);
        articles.push(...data);
      }
      redisClient.setex(
        'news',
        REDIS_EXPIRATION_TIME,
        JSON.stringify(articles)
      );
      res.json({
        status: 'success',
        message: 'News fetched from server',
        data: articles,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/valid-newspapers', (req, res) => {
  const validNewsPapers = newspapers.map((n) => n.name);
  res.json(validNewsPapers);
});

router.get('/:newspaper', async (req, res) => {
  const ignoreCache = req.query.ignoreCache;
  let loadFromServer: Boolean = true;
  try {
    const { newspaper: name } = req.params;
    const newspaper = newspapers.find((n) => n.name === name);
    if (newspaper) {
      const news =
        ignoreCache === 'true' ? null : await redisClient.get('news');
      if (news) {
        const articles: Article[] = JSON.parse(news);
        const filteredArticles = articles.filter(
          (a) => a.source === newspaper.name
        );
        if (filteredArticles) {
          loadFromServer = false;
          res.json({
            status: 'success',
            message: 'News fetched from cache',
            data: filteredArticles,
          });
        }
      }
      if (loadFromServer) {
        const articles = await loadNews(newspaper);
        res.json({
          status: 'success',
          message: 'News fetched from server',
          data: articles,
        });
      }
    } else {
      res.status(404).json({
        error: 'Not found',
        validNewsPapers: newspapers.map((n) => n.name),
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const loadNews = async (newspaper: typeof newspapers[0]) => {
  const articles: Article[] = [];
  const { data } = await axios.get(newspaper.address);
  const $ = cheerio.load(data);

  $('a:contains("climate")', data).each(function () {
    const title = $(this).text().trim();
    const url = newspaper.base + $(this).attr('href');

    articles.push({ title, url, source: newspaper.name });
  });
  return articles;
};

export const newsRouter = router;
