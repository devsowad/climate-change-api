import { newsRouter } from '@/routes/news';
import express from 'express';
import '@/schedule/news';

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to Climate Change News api');
});

app.use('/news', newsRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
