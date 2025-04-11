ARG NODE_VERSION=23
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /home/node

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine

WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/dist ./dist
COPY --from=builder --chown=node:node /home/node/package*.json ./

RUN npm ci --omit=dev

USER node

CMD ["node", "dist/server.js"]
