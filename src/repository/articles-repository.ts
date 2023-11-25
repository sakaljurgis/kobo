import {existsSync, readFileSync} from "fs";
import {writeFile} from "fs/promises";

interface Article {
  id: number;
  title: string;
  dateAdded: string;
  uid: string;
  url: string;
}

class ArticlesRepository {
  private readonly articles: Article[] = [];
  private counter: number = 0;

  constructor() {
    if (!existsSync('/data/articles.json')) {
      return;
    }
    const rawData = readFileSync('/data/articles.json', 'utf-8');
    const data = JSON.parse(rawData);
    this.articles = data.articles;
    this.counter = data.counter;
  }

  public add(article: Omit<Article, "id">): Article {
    const savedArticle = this.getByUid(article.uid);
    if (savedArticle) {
      //push article to the top
      this.articles.splice(this.articles.indexOf(savedArticle), 1);
      this.articles.unshift(savedArticle);

      Object.assign(savedArticle, article);
      this.saveDb();
      return savedArticle;
    }

    const completeArticle: Article = {
      ...article,
      id: this.counter++,
    }
    this.articles.unshift(completeArticle);
    this.saveDb();

    return completeArticle;
  }

  public getAll(): Article[] {
    return this.articles;
  }

  public get(id: number): Article | undefined {
    return this.articles.find((article) => article.id === id);
  }

  public getByUid(uid: string): Article | undefined {
    return this.articles.find((article) => article.uid === uid);
  }

  private async saveDb(): Promise<void> {
    await writeFile('/data/articles.json', JSON.stringify({
      articles: this.articles,
      counter: this.counter,
    }, null, 2));
  }
}

export const articlesRepository = new ArticlesRepository();
