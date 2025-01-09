FROM node:20

WORKDIR /app

COPY . /app

RUN npm install --legacy-peer-deps

EXPOSE 35410

CMD ["npm", "run", "dev"]