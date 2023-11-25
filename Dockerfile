FROM node:18

WORKDIR /srv/app
COPY ./ /srv/app

EXPOSE $PORT

CMD ["npm", "run", "start"]
