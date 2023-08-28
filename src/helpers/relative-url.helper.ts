export class RelativeUrl {
  private readonly url: URL;
  constructor(input: string) {
    this.url = new URL(input, 'relative:///');
  }

  toString(): string {
    return this.url.toString().replace('relative://', '');
  }

  setSearchParam(key: string, value: string): this {
    this.url.searchParams.set(key, value);

    return this;
  }
}
