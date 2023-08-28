import {RelativeUrl} from "./relative-url.helper";

export const generatePagination = (page: number, pages: number, url: RelativeUrl) => {
  const prev = page > 1 ? url.setSearchParam('page', (page - 1).toString()).toString() : '';
  const next = page < pages ? url.setSearchParam('page', (page + 1).toString()).toString()  : '';
  const pagination = [prev];

  for (let i = 1; i <= pages; i++) {
    if (page === i) {
      pagination.push('');
    } else {
      pagination.push(url.setSearchParam('page', i.toString()).toString());
    }
  }
  pagination.push(next);

  return pagination;
}
