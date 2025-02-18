import { NextFunction, Request, Response } from "express";
import { MissingValue, NotSupported } from "../library/error";

type ApiError = NotSupported | MissingValue;

export const errorHandler = (err: ApiError, req: Request, res: Response, _: NextFunction) => {
  req.log.error(err);

  switch (err?.type) {
    case "notSupported":
    case "missingValue":
      res.status(400);
      res.send({ message: err.message });
      break;
    default:
      res.status(500);
      res.send({ message: "Something wrong on server, please contact us" });
      break;
  }
};

