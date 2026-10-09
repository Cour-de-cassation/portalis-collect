import { Request, Response, NextFunction } from 'express'
import * as jwtUtils from '../utils/jwt'
import { UnauthorizedError } from './error'

const authentication = (req: Request, res: Response, next: NextFunction) => {
  const token = jwtUtils.extractBearerToken(req.headers.authorization ?? '')
  if (!token) {
    return next(new UnauthorizedError('Missing or invalid Authorization header.'))
  }

  const decoded = jwtUtils.verifyToken(token)
  if (!decoded) {
    return next(new UnauthorizedError('The provided token is invalid or has expired.'))
  }

  next()
}

export default authentication
