import dotenv from 'dotenv'
import { MissingValue } from './error'

if (!process.env.NODE_ENV) dotenv.config()

if (process.env.AUTHENTICATION_ID == null)
  throw new MissingValue("process.env.AUTHENTICATION_ID");
if (process.env.AUTHENTICATION_KEY == null)
  throw new MissingValue("process.env.AUTHENTICATION_KEY");
if (process.env.AUTH_STRATEGY == null)
  throw new MissingValue("process.env.AUTH_STRATEGY");
if (process.env.FILE_DB_URL == null)
  throw new MissingValue('process.env.FILE_DB_URL')
if (process.env.NODE_ENV == null)
  throw new MissingValue("process.env.NODE_ENV");
if (process.env.PORT == null)
  throw new MissingValue("process.env.PORT");
if (process.env.S3_ACCESS_KEY == null)
  throw new MissingValue("process.env.S3_ACCESS_KEY");
if (process.env.S3_BUCKET_NAME == null)
  throw new MissingValue("process.env.S3_BUCKET_NAME");
if (process.env.S3_REGION == null)
  throw new MissingValue("process.env.S3_REGION");
if (process.env.S3_SECRET_KEY == null)
  throw new MissingValue("process.env.S3_SECRET_KEY");
if (process.env.S3_URL == null)
  throw new MissingValue("process.env.S3_URL");

export const {
  ACCESS_TOKEN_LIFETIME_IN_SECONDS,
  AUTHENTICATION_ID,
  AUTHENTICATION_KEY,
  AUTH_STRATEGY,
  FILE_DB_URL,
  NODE_ENV,
  PORT,
  S3_ACCESS_KEY,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_SECRET_KEY,
  S3_URL
} = process.env
