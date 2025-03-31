ARG NODE_VERSION=23
ARG INCLUDE_DEV_DEPENDENCIES=false

FROM node:${NODE_VERSION}-alpine

USER node
WORKDIR /home/node

COPY --chown=node:node . .

RUN npm ci
RUN npm run build

RUN if [ "$INCLUDE_DEV_DEPENDENCIES" = "true" ]; then \
      echo "Installing all dependencies..."; \
      COPY --chown=node:node . .; \
      npm ci; \
      npm run build; \
    else \
      echo "Installing only production dependencies..."; \
    fi
    
CMD ["node", "dist/server.js"]
