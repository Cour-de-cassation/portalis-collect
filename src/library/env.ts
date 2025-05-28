import dotenv from 'dotenv'
import { missingValue } from './error'

if (!process.env.NODE_ENV) dotenv.config()

if (process.env.AUTHENTICATION_ID == null)
  throw missingValue("process.env.AUTHENTICATION_ID", new Error());
if (process.env.AUTHENTICATION_KEY == null)
  throw missingValue("process.env.AUTHENTICATION_KEY", new Error());
if (process.env.AUTH_STRATEGY == null)
  throw missingValue("process.env.AUTH_STRATEGY", new Error());
if (process.env.DBSDER_API_KEY == null)
  throw missingValue("process.env.DBSDER_API_KEY", new Error());
if (process.env.DBSDER_API_URL == null)
  throw missingValue("process.env.DBSDER_API_URL", new Error());
if (process.env.NLP_PSEUDONYMISATION_API == null)
  throw missingValue("process.env.NLP_PSEUDONYMISATION_API", new Error());
if (process.env.NODE_ENV == null)
  throw missingValue("process.env.NODE_ENV", new Error());
if (process.env.PORT == null)
  throw missingValue("process.env.PORT", new Error());
if (process.env.S3_ACCESS_KEY == null)
  throw missingValue("process.env.S3_ACCESS_KEY", new Error());
if (process.env.S3_BUCKET_NAME_NORMALIZED == null)
  throw missingValue("process.env.S3_BUCKET_NAME_NORMALIZED", new Error());
if (process.env.S3_BUCKET_NAME_RAW == null)
  throw missingValue("process.env.S3_BUCKET_NAME_RAW", new Error());
if (process.env.S3_REGION == null)
  throw missingValue("process.env.S3_REGION", new Error());
if (process.env.S3_SECRET_KEY == null)
  throw missingValue("process.env.S3_SECRET_KEY", new Error());
if (process.env.S3_URL == null)
  throw missingValue("process.env.S3_URL", new Error());

export const {
  ACCESS_TOKEN_LIFETIME_IN_SECONDS,
  AUTHENTICATION_ID,
  AUTHENTICATION_KEY,
  AUTH_STRATEGY,
  DBSDER_API_KEY,
  DBSDER_API_URL,
  NLP_PSEUDONYMISATION_API,
  NODE_ENV,
  NORMALIZATION_BATCH_SCHEDULE,
  PORT,
  S3_ACCESS_KEY,
  S3_BUCKET_NAME_NORMALIZED,
  S3_BUCKET_NAME_RAW,
  S3_REGION,
  S3_SECRET_KEY,
  S3_URL
} = process.env
