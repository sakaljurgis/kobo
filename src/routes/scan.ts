/**
 * scan for new books, currently rescan and index everything, delete is not done
 */

import * as express from 'express';
import { exec } from "child_process";
// @ts-ignore
import * as epubMetadata from "../libs/epub-metadata";
import { elasticSearch as es } from "../libs/elasticsearch";
import { booksRepository } from "../repository/books-repository";

export const scanRouter = express.Router();

scanRouter.get('/', async (req, res) => {
  // find epubs
  const findPromises: Promise<string[]>[] = [];
  const paths = Object.keys(process.env)
    .filter(key => key.startsWith('BOOKS_FOLDER_'))
    .map(key => process.env[key])
    .filter((path): path is string => !!path && path.length > 0);

  if (!paths) {
    res.send("oh well..");
    return;
  }
  paths.forEach(path => {
    findPromises.push(new Promise((resolve, reject) => {
      exec(`find "${path}" -name "*.epub"`, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        const files = stdout.split('\n').filter((file): file is string => !!file && file.length > 0);
        resolve(files);
      });
    }));
  });

  const results = (await Promise.all(findPromises)).flat();

  //get metadata
  const metadatas = await Promise.all(
    results.map(result => epubMetadata(result))
  );

  // map es to documents
  // @ts-ignore
  const metaWithPaths = metadatas.map((metadata, i) => {
    const title = metadata.title?.text ?? metadata.title;
    let creator = metadata.creator?.text ?? metadata.creator;
    let err = (metadata.title && metadata.creator) ? undefined : metadata;
    if (Array.isArray(creator)) {
      creator = creator.find(c => c.role === 'aut')?.text ?? creator[0]?.text ?? creator;
    }
    err = err ?? (Array.isArray(title) || Array.isArray(creator) ? metadata : undefined);
    const id =booksRepository.getId(results[i]);

    return {
      index: i,
      fileId: id,
      path: results[i],
      title,
      creator,
      err,
    }
  });

  await es.ping();
  await es.createIndex();

  for (const metaWithPath of metaWithPaths) {
    if (metaWithPath.err) {
      console.log("ignoring", metaWithPath.index)
      continue;
    }
    await es.addDocument({
      path: metaWithPath.path,
      title: metaWithPath.title,
      creator: metaWithPath.creator,
      fileId: metaWithPath.fileId,
    });
  }
  //return metaWithPaths;
  //res.end(JSON.stringify(metaWithPaths));
  //res.end(`scan complete, ${metaWithPaths.length} total books`);

  res.render('empty', {
    body: `scan complete, ${metaWithPaths.length} total books`,
  });
});
