FROM node:23-alpine

USER node
WORKDIR /home/node

ARG INCLUDE_DEV_DEPENDENCIES=false

COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./package.json ./package.json

RUN if [ "$INCLUDE_DEV_DEPENDENCIES" = true ]; then \
      npm ci; \
    else \
      npm ci --omit=dev; \
    fi

CMD ["node", "dist/server.js"]
