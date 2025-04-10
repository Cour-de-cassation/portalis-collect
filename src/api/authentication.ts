import { NextFunction, Request, Response } from "express";
import OAuthServer from "@node-oauth/express-oauth-server";

import { unauthorizedError } from "../library/error";
import { validateBasic, validateOAuth } from "../service/authentication";

export const basicAuthHandler = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Basic ")
  ) {
    const base64Credentials = req.headers.authorization.slice("Basic ".length);
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");
    if (validateBasic(username, password)) return next();
  }

  return next(
    unauthorizedError(
      new Error("Basic auth Username or password seems incorrect.")
    )
  );
};

export const oAuthHandler = new OAuthServer({
  model: validateOAuth,
}).authorize();
