FROM node:23-alpine

USER node
WORKDIR /home/node

COPY --chown=node:node . .

RUN npm ci
RUN npm run build

CMD ["node", "dist/server.js"]
