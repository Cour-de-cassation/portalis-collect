import { NextFunction, Request, Response, Router, urlencoded } from "express";
import OAuth2Server, {
  Request as oAuthRequest,
  Response as oAuthResponse,
} from "@node-oauth/oauth2-server";

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
    if (!!validateBasic(username, password)) return next();
  }

  return next(
    unauthorizedError(
      new Error("Basic auth Username or password seems incorrect.")
    )
  );
};

const oAuthServer = new OAuth2Server({ model: validateOAuth });

export const oAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedToken = await oAuthServer.authenticate(
      new oAuthRequest(req),
      new oAuthResponse(res)
    );
    if (!authenticatedToken) throw new Error("AuthenticatedToken is missing.");
    return next();
  } catch (err) {
    return next(
      unauthorizedError(new Error("Token or credentials seems incorrect."))
    );
  }
};

const app = Router();
app.post("/token", urlencoded({ extended: true }), async (req, res, next) => {
  try {
    const t = await oAuthServer.token(
      new oAuthRequest(req),
      new oAuthResponse(res),
      {} // TS & JS of oAuth2Server are weird -> options seems needed even if it's empty.
    );
    res.send({
      accessToken: t.accessToken,
      accessTokenExpiresAt: t.accessTokenExpiresAt,
    });
  } catch (err) {
    next(
      unauthorizedError(
        new Error(
          err instanceof Error ? err.message : "Credentials seems incorrect."
        )
      )
    );
  }
});

export default app;
