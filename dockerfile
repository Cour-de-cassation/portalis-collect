FROM node:20-alpine

USER node
WORKDIR /home/node

COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./package.json ./package.json

RUN npm ci --omit=dev

CMD ["node", "dist/server.js"]