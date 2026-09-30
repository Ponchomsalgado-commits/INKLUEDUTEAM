FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

CoPY . .

RUN npx prisma generate

ExPOSE 3000

CMD ["npm", "run", "start:dev"]