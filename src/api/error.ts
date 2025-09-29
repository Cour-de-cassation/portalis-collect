import { NextFunction, Request, Response } from "express";
import { isCustomError } from "../library/error";
import { responseLog } from "./logger";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error({ 
    path: "src/api/error.ts", 
    operations: ["other", `${req.method} ${req.path}`],
    message: err.message,
    stack: err.stack
  })

  if (isCustomError(err)) {
    switch (err.type) {
      case 'notSupported':
        res.status(400)
        res.send({ error: err })
        return responseLog(req, res)
      case 'missingValue':
        res.status(400)
        res.send({ error: err })
        return responseLog(req, res)
      case 'notFound':
        res.status(404)
        res.send({ error: err })
        return responseLog(req, res)
      case 'unauthorizedError':
        res.status(401)
        res.send({ error: err })
        return responseLog(req, res)
      case 'forbiddenError':
        res.status(403)
        res.send({ error: err })
        return responseLog(req, res)
    }
  }

  res.status(500)
  res.send({ error: 'Something wrong on server, please contact us' })
  return responseLog(req, res)
}
