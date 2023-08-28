import * as express from 'express';
import {RelativeUrl} from "../helpers/relative-url.helper";
import {articlesRepository} from "../repository/articles-repository";
import {generatePagination} from "../helpers/generate-pagination";

export const articlesRouter = express.Router();

articlesRouter.get('/:id', (req, res) => {
  const article = articlesRepository.get(Number(req.params.id));
  if (article) {
    return res.download(`/data/articles/${article.uid}/article.epub`);
  }
  throw new Error('article not found');
});

articlesRouter.get('/', (req, res) => {
  const page: number = parseInt(req.query.page as string) || 1;
  const perPage = 6;
  const articles = articlesRepository.getAll();
  const searchResults = articles.slice((page - 1) * perPage, page * perPage);
  const pages = Math.ceil(articles.length / perPage);

  const url = new RelativeUrl(req.originalUrl);

  res.render('articles', {
    title: `articles`,
    searchResults,
    pagesList: generatePagination(page, pages, url),
  });
});

