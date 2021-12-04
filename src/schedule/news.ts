import { redisClient } from '@/lib/redis';
import { Article, loadNews } from '@/routes/news';
import { NEWS_SCHEDULER_RULE, REDIS_EXPIRATION_TIME } from '@/utils/constants';
import { newspapers } from '@/utils/newspapers';
import { scheduleJob } from 'node-schedule';

scheduleJob(NEWS_SCHEDULER_RULE, async () => {
  const articles: Article[] = [];
  for (let i = 0; i < newspapers.length; i++) {
    const data = await loadNews(newspapers[i]);
    articles.push(...data);
  }
  redisClient.setex('news', REDIS_EXPIRATION_TIME, JSON.stringify(articles));
});
