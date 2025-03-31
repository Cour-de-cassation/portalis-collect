ARG NODE_VERSION=23
ARG INCLUDE_DEV_DEPENDENCIES=false

FROM node:${NODE_VERSION}-alpine

USER node
WORKDIR /home/node

COPY --chown=node:node . .

RUN npm ci
RUN npm run build

CMD ["node", "dist/server.js"]
