import * as express from 'express';
import {extract} from '@extractus/article-extractor'
import {createWriteStream, existsSync, mkdir, writeFile} from "fs";
import * as crypto from "crypto";
import * as cheerio from 'cheerio';
import {Readable} from "stream";
import {rm} from "fs/promises";
import {articlesRepository} from "../repository/articles-repository";
import {ReadableStream} from "node:stream/web";
import {spawn} from "child_process";

export const addArticleRouter = express.Router();
/*
ebook-convert article.html article.epub --title="Bank of England signals ‘significant’ response to pound turmoil" --authors="Article"
*/

addArticleRouter.get('/', (req, res) => {
  const url = req.query.url as string;

  if (url) {
    extract(url as string).then((article) => {
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const dir = `/data/articles/${hash}`;
      if (!article) {
        res.render('article-added', {
          title: 'article not found',
        });
        return;
      }

      const articleEntity = articlesRepository.add({
        uid: hash,
        title: article.title ?? 'no title',
        dateAdded: new Date().toISOString().split('T')[0],
        url,
      });

      mkdir(dir, {recursive: true}, (err) => {
        if (err) throw err;
        writeFile(`${dir}/article.json`, JSON.stringify(article, null, 2), (err) => {
          if (err) throw err;
          console.log('json file saved');
          const rawHtml = article.content as string;
          const $ = cheerio.load(rawHtml);

          const downloadImagesPromises: Promise<void>[] = [];

          $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
              const img = src.split('/').pop();
              const imgPath = `${dir}/${img}`;

              downloadImagesPromises.push(downloadImage(src, imgPath));

              $(el).attr('src', `./${img}`);
            }
          });

          Promise.all<void>(downloadImagesPromises).then(() => {
            console.log('all images downloaded');
            let commandOutput = '';
            const command = spawn('ebook-convert', [
              `${dir}/article.html`,
              `${dir}/article.epub`,
              '--title',
              article.title ?? 'no title',
              '--authors',
              'Article',
            ]);
            command.on('error', (err) => {
              console.log(err);
            });
            command.stdout.on('data', (data) => {
              commandOutput += data.toString();
            });
            command.stderr.on('data', (data) => {
              commandOutput += data.toString();
            })
            command.on('close', (code) => {
              writeFile(`${dir}/article-convert-output.txt`, commandOutput, (err) => {});
              console.log(`book conversion ended with ${code}`);
              res.render('article-added', {
                title: 'article added',
                id: articleEntity.id,
              });
            });
          })

          writeFile(`${dir}/article.html`, $.html(), (err) => {
            console.log('html file saved');
          });

        });
      });
    })
    return;
  }

  res.render('add-article', {
    title: "please article enter url",
  });
});

function downloadImage(imgSrc: string, imgPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (existsSync(imgPath)) {
      //don't download if already exists
      console.log(`${imgPath} already exists`);
      return resolve();
    }
    fetch(imgSrc).then((res) => {
      const body = res.body;
      if (body === null) {
        console.log(`${imgSrc} not downloadable`);

        return;
      }

      // @ts-ignore
      downloadStream(imgPath, body)
        .then(() => resolve())
        .catch((e) => reject(e));
    })
  });
}

function deleteIfExists(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (existsSync(path)) {
      return rm(path).then(() => resolve()).catch((e) => reject(e));
    }

    return resolve();
  });
}

function downloadStream(path: string, readableStream: ReadableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    deleteIfExists(path).then(() => {
      const dest = createWriteStream(path, {flags: 'wx'});
      Readable.fromWeb(readableStream)
        .pipe(dest)
        .on("finish", () => {
          console.log(`${path} downloaded`);
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    }).catch((e) => reject(e));
  });
}
