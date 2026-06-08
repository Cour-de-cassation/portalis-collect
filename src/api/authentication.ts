import { Request, Response, Router, urlencoded } from "express"
import { JWT_EXPIRATION_SECONDS } from "../config/env"
import * as jwtUtils from "../utils/jwt"
import { logger } from "../config/logger"

const router = Router()

router.post("/token", urlencoded({ extended: false }), (req: Request, res: Response) => {
  try {

    const grantType = req.body?.grant_type
    if (grantType !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials grant type is supported'
      })
    }

    const { clientId, clientSecret } = jwtUtils.extractClientCredentials(
      req.body,
      req.headers.authorization ?? ''
    )
    if (!clientId || !clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      })
    }

    if (!jwtUtils.isValidClient(clientId, clientSecret)) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      })
    }

    const accessToken = jwtUtils.generateToken(clientId)
    if (!accessToken) {
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to generate token'
      })
    }

    return res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: parseInt(JWT_EXPIRATION_SECONDS, 10)
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error({
      path: __filename,
      operations: ['other', 'token'],
      message: `Token generation error: ${err.message}`,
      stack: err.stack
    })

    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    })
  }
})

export default router
