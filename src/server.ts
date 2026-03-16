import express, { Express } from "express";
import helmet from "helmet";

import { logger, loggerHttp } from "./config/logger";
import cphFileRoute from "./api/rawCph";
import { errorHandler } from "./api/error";
import authRoute from "./api/authentication";
import { requestLog } from "./api/logger";
import { PORT } from "./config/env";
import { NotFound } from "./services/error";

const app: Express = express();

app
  .use(helmet())
  .use(loggerHttp)

  .use(requestLog)

  .use(authRoute)
  .use(cphFileRoute)

  .use((req, _, next) => next(new NotFound('path', `${req.method} ${req.path} doesn't exists`)))
  .use(errorHandler)

app.listen(PORT, () => {
  logger.info({
    path: "src/server.ts",
    operations: ["other", "startServer"],
    message: `PORTALIS-COLLECT running on port ${PORT}`
  });
});
