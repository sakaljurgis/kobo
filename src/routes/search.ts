import * as express from 'express';
import { RelativeUrl } from "../helpers/relative-url.helper";
import { generatePagination } from "../helpers/generate-pagination";
import { elasticSearch as es } from "../libs/elasticsearch";

export const searchRouter = express.Router();

searchRouter.get('/', async (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
    res.render('search', {
      title: `search`,
      searchResults: [],
      query: '',
      pagesList: [],
    });
    return;
  }

  const page: number = parseInt(req.query.page as string) || 1;
  const perPage = 6;
  const offset = (page - 1) * perPage;
  let pages = 1;

  const result = await es.search(searchQuery as string, perPage, offset);
  const searchResults = result.hits.hits.map((hit: any) => {
    return {
      title: `${hit._source.creator} - ${hit._source.title}`,
      id: hit._source.fileId,
    }
  });
  if (result.hits.total && typeof result.hits.total === "object" && "value" in result.hits.total) {
    pages = Math.ceil(result.hits.total.value / perPage);
  }

  const url = new RelativeUrl(req.originalUrl);

  res.render('search', {
    title: `search results for ${searchQuery}`,
    searchResults,
    query: searchQuery,
    pagesList: generatePagination(page, pages, url),
  });
});
