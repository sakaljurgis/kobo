import * as express from 'express';
import {engine} from "express-handlebars";
import {indexRouter} from "./routes";
import {searchRouter} from "./routes/search";
import {join} from "path";
import {addArticleRouter} from "./routes/add-article";
import {articlesRouter} from "./routes/articles";
import { booksRouter } from "./routes/books";
import { scanRouter } from "./routes/scan";

const PORT = process.env.PORT || 3000;
const app = express();

const hbsOptions = {
  extname: '.hbs',
  helpers: {
    toJSON: (obj: any) => JSON.stringify(obj, null, 2),
  }
}

app.engine('.hbs', engine(hbsOptions));
app.set('view engine', '.hbs');
app.set('views', 'src/views');

app.use(express.static(join(__dirname, 'public')));

app.use("*", (req, res, next) => {
  console.log(req.originalUrl);
  next();
});

app.use("/", indexRouter);
app.use("/search", searchRouter);
app.use("/add-article", addArticleRouter);
app.use("/articles", articlesRouter);
app.use("/books", booksRouter);
app.use("/scan", scanRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
