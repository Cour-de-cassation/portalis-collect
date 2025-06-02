import { NextFunction, Request, Response } from "express";
import { isCustomError, MissingValue, NotSupported, UnauthorizedError, UnexpectedError } from "../library/error";


export const errorHandler = (err: unknown, req: Request, res: Response, _: NextFunction) => {
  req.log.error(err);

  if (isCustomError(err)) {
    switch (err.type) {
      case "notSupported":
      case "missingValue":
        res.status(400);
        res.send({ message: err.message });
        break;
      case 'notFound':
        res.status(404)
        res.send({ message: err.message })
        break
      case 'unauthorizedError':
        res.status(401)
        res.send({ message: err.message })
        break
      case 'forbiddenError':
        res.status(403)
        res.send({ message: err.message })
        break
    }
  }

  res.status(500)
  res.send({ message: "Something wrong on server, please contact us" });
};
