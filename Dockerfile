FROM node:lts-alpine3.17

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run gen/all && npm run build

CMD ["npm", "run", "main"]

