import { NextFunction, Request, Response, Router, urlencoded } from "express";
import OAuth2Server, {
  Request as oAuthRequest,
  Response as oAuthResponse,
} from "@node-oauth/oauth2-server";

import { NotSupported, UnauthorizedError } from "../library/error";
import { validateBasic, validateOAuth } from "../service/authentication";
import { ACCESS_TOKEN_LIFETIME_IN_SECONDS, AUTH_STRATEGY } from "../library/env";

const basicAuthHandler = (
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

    if (!!username && !!password && !!validateBasic(username, password)) return next();
  }

  return next(
    new UnauthorizedError("Basic auth Username or password seems incorrect.")
  );
};

function oAuthHandler(
  oAuthServer: OAuth2Server
) {
  return async (
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
        new UnauthorizedError("Token or credentials seems incorrect.")
      );
    }
  };
}

function oAuthTokenRoute(oAuthServer: OAuth2Server) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
        new UnauthorizedError(
          err instanceof Error ? err.message : "Credentials seems incorrect."
        )
      );
    }
  }
}

function authRouteConstructor(): Router {
  const app = Router();

  if (AUTH_STRATEGY === 'basic') {
    app.use(basicAuthHandler)
    return app
  }

  const accessTokenLifetime = ACCESS_TOKEN_LIFETIME_IN_SECONDS == null ? NaN : parseInt(ACCESS_TOKEN_LIFETIME_IN_SECONDS)
  if (isNaN(accessTokenLifetime)) throw new NotSupported("ACCESS_TOKEN_LIFETIME_IN_SECONDS", ACCESS_TOKEN_LIFETIME_IN_SECONDS)
  const oAuthServer = new OAuth2Server({ model: validateOAuth, accessTokenLifetime });

  app.post("/token", urlencoded({ extended: true }), oAuthTokenRoute(oAuthServer))
  app.use(oAuthHandler(oAuthServer))
  return app
}

export default authRouteConstructor()
