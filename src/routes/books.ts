import * as express from 'express';
import { booksRepository } from "../repository/books-repository";

export const booksRouter = express.Router();

booksRouter.get('/', (req, res) => {
  res.render('books-index', {
    title: `books`,
  });
});

booksRouter.get('/:id', (req, res) => {
  const bookPath = booksRepository.getPath(Number(req.params.id));
  if (bookPath) {
    return res.download(bookPath);
  }

  throw new Error('book not found');
});
