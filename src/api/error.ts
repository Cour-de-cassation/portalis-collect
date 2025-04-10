import { NextFunction, Request, Response } from "express";
import { MissingValue, NotSupported, UnauthorizedError, UnexpectedError } from "../library/error";

type ApiError = NotSupported | MissingValue | UnauthorizedError | UnexpectedError;

export const errorHandler = (err: ApiError, req: Request, res: Response, _: NextFunction) => {
  req.log.error(err);

  switch (err?.type) {
    case "notSupported":
    case "missingValue":
      res.status(400);
      res.send({ message: err.message });
      break;
    case "unauthorizedError":
      res.status(401);
      res.send({ message: err.message })
      break;
    default:
      res.status(500);
      res.send({ message: "Something wrong on server, please contact us" });
      break;
  }
};
