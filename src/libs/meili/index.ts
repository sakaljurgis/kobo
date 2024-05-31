import { MeiliSearch as MS } from 'meilisearch'
import { DataType } from '../elasticsearch';

class MeiliSearch {
  private readonly client: MS

  constructor() {
    this.client = new MS({
      host: process.env.MEILI_HOST || 'http://localhost:7700',
    });
  }

  async createIndex() {
    //todo add searchable and filterable fields
    let index = null;
    try {
      index = await this.client.getIndex('books')
      console.log('index found');
    } catch (e) {
      console.log('index not found');
      index = await this.client.createIndex('books')
    }
    return index;
  }

  async addDocument(document: DataType) {
    return this.client.index('books').addDocuments([document]);
  }
}

export const meiliSearch = new MeiliSearch();

meiliSearch.createIndex();
