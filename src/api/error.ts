import { NextFunction, Request, Response } from "express";
import { isCustomError } from "../library/error";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error({ 
    path: "src/api/error.ts", 
    operations: ["other", `${req.method} ${req.path}`],
    message: `${err}` 
  })

  if (isCustomError(err)) {
    switch (err.type) {
      case 'notSupported':
        res.status(400)
        res.send({ message: err.message })
        return next()
      case 'missingValue':
        res.status(400)
        res.send({ message: err.message })
        return next()
      case 'notFound':
        res.status(404)
        res.send({ message: err.message })
        return next()
      case 'unauthorizedError':
        res.status(401)
        res.send({ message: err.message })
        return next()
      case 'forbiddenError':
        res.status(403)
        res.send({ message: err.message })
        return next()
    }
  }

  res.status(500)
  res.send({ message: 'Something wrong on server, please contact us' })
  return next()
}
