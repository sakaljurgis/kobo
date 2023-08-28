import * as express from 'express';
import {RelativeUrl} from "../helpers/relative-url.helper";
import {generatePagination} from "../helpers/generate-pagination";

export const searchRouter = express.Router();

const searchQueries = [
  "1. first entry",
  "2. second entry",
  "3. third entry",
  "4. fourth entry",
  "5. fifth entry",
  "6. sixth entry",
  "7. seventh entry",
  "8. eighth entry",
  "9. ninth entry",
  "10. tenth entry",
  "11. eleventh entry",
];

searchRouter.get('/', (req, res) => {
  const searchQuery = req.query.query;

  const page: number = parseInt(req.query.page as string) || 1;
  const perPage = 6;
  const searchResults = searchQueries.slice((page - 1) * perPage, page * perPage);
  const pages = Math.ceil(searchQueries.length / perPage);

  const url = new RelativeUrl(req.originalUrl);

  res.render('search', {
    title: `search results for ${searchQuery}`,
    searchResults,
    query: searchQuery,
    pagesList: generatePagination(page, pages, url),
  });
});
