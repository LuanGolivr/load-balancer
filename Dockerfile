FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache curl

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]