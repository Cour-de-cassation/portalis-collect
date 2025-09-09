import express, { Express } from "express";
import helmet from "helmet";

import { CustomLogger, logger, loggerHttp } from "./library/logger";
import cphFileRoute from "./api/rawCph";
import { errorHandler } from "./api/error";
import authRoute from "./api/authentication";
import { PORT } from "./library/env";

const app: Express = express();

app
  .use(helmet())
  .use(loggerHttp)
  .use(authRoute)
  .use(cphFileRoute)
  .use(errorHandler);

app.listen(PORT, () => {
  logger.info({
    path: "src/server.ts",
    operations: ["collect", "startServer"],
    message: `PORTALIS-COLLECT running on port ${PORT}`
  });
});
