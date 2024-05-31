import { Client, errors } from '@elastic/elasticsearch';
import { meiliSearch } from '../meili';

export interface DataType {
  path: string;
  title: string;
  creator: string;
  fileId: number;

  [key: string]: string | number;
}

export class ElasticSearch {
  private readonly client: Client;

  constructor(private readonly indexName: string = 'books') {
    this.client = new Client({
      node: `http://${process.env.ES_HOST}:${process.env.ES_PORT || 9200}`,
    });
  }

  async ping() {
    return this.client.ping();
  }

  async createIndex() {
    const exists = await this.client.indices.exists({
      index: this.indexName,
    });

    if (exists) {
      return;
    }

    await this.client.indices.create({
      index: this.indexName,
      mappings: {
        properties: {
          path: { type: 'text' },
          title: { type: 'text', analyzer: 'autocomplete', search_analyzer: 'standard' },
          creator: { type: 'text', analyzer: 'autocomplete', search_analyzer: 'standard' },
          fileId: { type: 'integer' },
        },
      },
      settings: {
        max_ngram_diff: 19,
        analysis: {
          filter: {
            autocomplete_filter: {
              type: 'ngram',
              min_gram: 1,
              max_gram: 20,
            },
          },
          analyzer: {
            autocomplete: {
              filter: ['lowercase', 'autocomplete_filter', "asciifolding"],
              type: 'custom',
              tokenizer: 'standard',
            },
          },
        },
        number_of_replicas: 1,
      },
    });
  };

  async addDocument(payload: DataType) {
    meiliSearch.addDocument(payload).then();
    return this.client.index({
      index: this.indexName,
      id: payload.path,
      document: payload
    });
  };

  async search(query: string, limit: number, offset: number) {
    return this.client.search({
      index: this.indexName,
      query: {
        multi_match: {
          query,
          fields: ['title', 'creator'],
        },
      },
      size: limit,
      from: offset,
    });
  };
}

export const elasticSearch = new ElasticSearch();
