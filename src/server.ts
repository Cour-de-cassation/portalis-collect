import express, { Express } from "express";
import helmet from "helmet";

import { loggerHttp } from "./library/logger";
import cphFileRoute from "./api/cphFile";
import { errorHandler } from "./api/error";
import { missingValue } from "./library/error";
import authenticationRoute, {
  basicAuthHandler,
  oAuthHandler,
} from "./api/authentication";

if (process.env.PORT == null)
  throw missingValue("process.env.PORT", new Error());
if (process.env.AUTH_STRATEGY == null)
  throw missingValue("process.env.AUTH_STRATEGY", new Error());
const { PORT, AUTH_STRATEGY } = process.env;

const app: Express = express();
const authenticationStrategy =
  AUTH_STRATEGY === "basic" ? basicAuthHandler : oAuthHandler;

app
  .use(helmet())
  .use(loggerHttp)
  .use(authenticationRoute)
  .use(authenticationStrategy)
  .use(cphFileRoute)
  .use(errorHandler);

app.listen(PORT);
