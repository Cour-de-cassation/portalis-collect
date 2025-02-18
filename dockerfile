FROM node:20-alpine

USER node
WORKDIR /home/node

COPY . .

CMD ["npm", "run", "start:api:watch"]
