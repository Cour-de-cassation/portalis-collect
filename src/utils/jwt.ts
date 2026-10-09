import * as jwt from 'jsonwebtoken'
import {
  JWT_CLIENT_ID,
  JWT_CLIENT_SECRET,
  JWT_ISSUER,
  JWT_ALGORITHM,
  JWT_SECRET,
  JWT_EXPIRATION_SECONDS,
  JWT_ACCEPTED_ISSUERS
} from '../config/env'
import { timingSafeEqual } from 'crypto'
import { logger } from '../config/logger'

const JWT_SUBJECT = 'system'
const acceptedIssuers = JWT_ACCEPTED_ISSUERS.split(',').map((s) => s.trim())

export function generateToken(clientId: string): string | null {
  try {
    const payload = {
      sub: JWT_SUBJECT,
      clientId
    }
    const options = {
      algorithm: JWT_ALGORITHM as jwt.Algorithm,
      issuer: JWT_ISSUER,
      expiresIn: JWT_EXPIRATION_SECONDS
    }

    return jwt.sign(payload, JWT_SECRET, options)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error({
      path: __filename,
      operations: ['other', 'generateToken'],
      message: `Generate token error: ${err.message}`,
      stack: err.stack
    })

    return null
  }
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const options = {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
      issuer: acceptedIssuers as [string, ...string[]]
    }

    return jwt.verify(token, JWT_SECRET, options) as jwt.JwtPayload
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error({
      path: __filename,
      operations: ['other', 'verifyToken'],
      message: `Verify token error: ${err.message}`,
      stack: err.stack
    })

    return null
  }
}

export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7)
}

export function extractClientCredentials(
  body: { client_id?: string; client_secret?: string },
  authHeader: string
): { clientId: string | null; clientSecret: string | null } {
  let result: { clientId: string | null; clientSecret: string | null }
  let source: string

  if (body?.client_id) {
    source = 'body'
    result = {
      clientId: body.client_id,
      clientSecret: body.client_secret ?? null
    }
  } else if (authHeader?.startsWith('Basic ')) {
    source = 'Basic header'
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
    const colonIndex = decoded.indexOf(':')
    result =
      colonIndex >= 0
        ? {
            clientId: decoded.substring(0, colonIndex),
            clientSecret: decoded.substring(colonIndex + 1)
          }
        : { clientId: null, clientSecret: null }
  } else {
    source = 'none'
    result = { clientId: null, clientSecret: null }
  }

  logger.info({
    path: __filename,
    operations: ['other', 'extractClientCredentials'],
    message: `POST /token - client_id: ${result.clientId ?? 'missing'}, auth: ${source}`
  })
  return result
}

export function isValidClient(clientId: string, clientSecret: string): boolean {
  return safeCompare(clientId, JWT_CLIENT_ID) && safeCompare(clientSecret, JWT_CLIENT_SECRET)
}

function safeCompare(userInput: string, secret: string): boolean {
  const userInputLength = Buffer.byteLength(userInput)
  const secretLength = Buffer.byteLength(secret)
  const userInputBuffer = Buffer.alloc(userInputLength, 0, 'utf8')
  userInputBuffer.write(userInput)
  const secretBuffer = Buffer.alloc(userInputLength, 0, 'utf8')
  secretBuffer.write(secret)

  return !!(timingSafeEqual(userInputBuffer, secretBuffer) && userInputLength === secretLength)
}
