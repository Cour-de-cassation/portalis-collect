ARG NODE_VERSION=23
ARG INCLUDE_DEV_DEPENDENCIES=false

FROM node:${NODE_VERSION}-alpine

USER node
WORKDIR /home/node

COPY --chown=node:node . .

RUN npm ci
RUN npm run build

COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./package.json ./package.json

RUN if [ "$INCLUDE_DEV_DEPENDENCIES" = "true" ]; then \
      npm ci; \
    else \
      npm ci --omit=dev; \
    fi

CMD ["node", "dist/server.js"]
