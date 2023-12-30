import {existsSync, readFileSync} from "fs";
import {writeFile} from "fs/promises";

class BooksRepository {
  private readonly idByPath: Record<string, number> = {};
  private counter: number = 1;
  private saveDbTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (!existsSync('/data/books.json')) {
      return;
    }

    const rawData = readFileSync('/data/books.json', 'utf-8');
    const data = JSON.parse(rawData);
    this.idByPath = data.idByPath ?? {};
    this.counter = data.counter ?? 1;
  }

  public getId(path: string): number {
    if (this.idByPath[path]) {
      return this.idByPath[path];
    }

    const id = this.counter++;
    this.idByPath[path] = id;
    // delay save, save only once in 5 seconds
    if (!this.saveDbTimeout) {
     this.saveDbTimeout = setTimeout(() => {
       this.saveDbTimeout = null;
       this.saveDb();
     }, 5000);
    }

    return id;
  }

  public getPath(id: number): string | undefined {
    return Object.entries(this.idByPath).find(([path, _id]) => _id == id )?.[0];
  }

  private async saveDb(): Promise<void> {
    await writeFile('/data/books.json', JSON.stringify({
      idByPath: this.idByPath,
      counter: this.counter,
    }, null, 2));
  }
}

export const booksRepository = new BooksRepository();
