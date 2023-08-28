FROM node:18

#install calibre
RUN apt-get update -y
RUN apt-get install -y libopengl0
RUN apt-get install -y libegl1
RUN wget -nv -O- https://download.calibre-ebook.com/linux-installer.sh | sh /dev/stdin

WORKDIR /srv/app
COPY ./ /srv/app
RUN npm install

EXPOSE $PORT

CMD ["npm", "run", "dev"]
