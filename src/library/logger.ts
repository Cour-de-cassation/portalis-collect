import pino, { LoggerOptions } from "pino";
import pinoHttp from "pino-http";
import { NODE_ENV } from "./env";
import { Request } from "express";
import { randomUUID } from "crypto";

type DecisionLog = {
  level: "info"
  type: "decision"
  appName: "portalis-collect",
  decision: { sourceId: string, sourceName: string }
  path: string
  operations: readonly ["collect" | "extraction" | "normalization", string]
  message?: string
}

type TechLog = {
  level: "info" | "warn" | "error"
  type: "tech",
  appName: "portalis-collect"
  path: string
  operations: readonly ["collect" | "extraction" | "normalization", string]
  message?: string
}

const pinoPrettyConf = {
  target: "pino-pretty",
  options: {
    singleLine: true,
    colorize: true,
    translateTime: "UTC:dd-mm-yyyy - HH:MM:ss Z",
  },
};

const loggerOptions: LoggerOptions = {
  base: { appName: "portalis-collect" },
  formatters: {
    level: (label) => {
      return {
        logLevel: label.toUpperCase(),
      };
    },
  },
  timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  redact: {
    paths: [
      "req",
      "res",
      "headers",
      "ip",
      "responseTime",
      "hostname",
      "pid",
      "level",
    ],
    censor: "",
    remove: true,
  },
  transport:
    NODE_ENV === "development" ? pinoPrettyConf : undefined,
};

const pinoLogger = pino(loggerOptions);

export const loggerHttp = pinoHttp<Request>({
  ...loggerOptions,
  autoLogging: false,
  genReqId: () => randomUUID(),
  customProps: (req) => {
    console.log(req.originalUrl)
    return ({
      type: "tech",
      appName: "portalis-collect",
      operations: ["collect", req.originalUrl],
      requestId: req.id
    })
  },
}); // attach logger instance at req (req.log will log message and req info)


function decision(
  sourceId: DecisionLog["decision"]["sourceId"],
  path: DecisionLog["path"],
  operations: DecisionLog["operations"],
  message?: DecisionLog["message"]
) {
  const log: DecisionLog = {
    type: "decision",
    level: "info",
    appName: "portalis-collect",
    decision: { sourceId, sourceName: "portalis-cph" },
    path,
    message,
    operations
  }
  pinoLogger.info(log)
}

function info(
  path: TechLog["path"],
  operations: TechLog["operations"],
  message?: TechLog["message"]
) {
  const log: TechLog = {
    level: "info",
    appName: "portalis-collect",
    path,
    message,
    operations: operations,
    type: "tech"
  }
  pinoLogger.info(log)
}

function warn(
  path: TechLog["path"],
  operations: TechLog["operations"],
  message?: TechLog["message"]
) {
  const log: TechLog = {
    level: "warn",
    appName: "portalis-collect",
    path,
    message,
    operations: operations,
    type: "tech"
  }
  pinoLogger.warn(log)
}

function error(
  path: TechLog["path"],
  operations: TechLog["operations"],
  message?: TechLog["message"]
) {
  const log: TechLog = {
    level: "error",
    appName: "portalis-collect",
    path,
    message,
    operations: operations,
    type: "tech"
  }
  pinoLogger.error(log)
}

export const logger = {
  info,
  warn,
  error,
  decision
}

