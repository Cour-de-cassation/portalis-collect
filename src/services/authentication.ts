import { Request, Response, NextFunction } from 'express'
import * as jwtUtils from '../utils/jwt'
import { logger } from '../config/logger'

const authentication = (req: Request, res: Response, next: NextFunction) => {
  const token = jwtUtils.extractBearerToken(req.headers.authorization ?? '')
  if (!token) {
    logger.error({
      path: 'src/services/authentication.ts',
      operations: ['other', 'authentication'],
      message: `Missing or invalid Authorization header`,
      stack: ''
    })

    return res.status(400).json({
      error: 'missing_token',
      error_description: 'Missing or invalid Bearer token.'
    })
  }

  const decoded = jwtUtils.verifyToken(token)
  if (!decoded) {
    logger.error({
      path: 'src/services/authentication.ts',
      operations: ['other', 'authentication'],
      message: `Invalid or expired token`,
      stack: ''
    })

    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'The provided token is invalid or has expired.'
    })
  }

  next()
}

export default authentication
