FROM node:23-alpine

ARG INCLUDE_DEV_DEPENDENCIES=false

USER node
WORKDIR /home/node

COPY --chown=node:node . .

RUN if [ "$INCLUDE_DEV_DEPENDENCIES" = true ]; then \
      npm ci; \
    else \
      npm ci --omit=dev; \
    fi

RUN npm run build

CMD ["node", "dist/server.js"]
