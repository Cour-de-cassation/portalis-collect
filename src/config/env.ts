import dotenv from "dotenv";
import { MissingValue } from "../services/error";

if (!process.env.ENV) dotenv.config();

if (process.env.AUTH_TYPE == null)
  throw new MissingValue("process.env.AUTH_TYPE");
if (process.env.JWT_CLIENT_ID == null)
  throw new MissingValue("process.env.JWT_CLIENT_ID");
if (process.env.JWT_CLIENT_SECRET == null)
  throw new MissingValue("process.env.JWT_CLIENT_SECRET");
if (process.env.JWT_SECRET == null)
  throw new MissingValue("process.env.JWT_SECRET");
if (process.env.JWT_ISSUER == null)
  throw new MissingValue("process.env.JWT_ISSUER");
if (process.env.JWT_ACCEPTED_ISSUERS == null)
  throw new MissingValue("process.env.JWT_ACCEPTED_ISSUERS");
if (process.env.JWT_ALGORITHM == null)
  throw new MissingValue("process.env.JWT_ALGORITHM");
if (process.env.JWT_EXPIRATION_SECONDS == null)
  throw new MissingValue("process.env.JWT_EXPIRATION_SECONDS");
if (process.env.FILE_DB_URL == null)
  throw new MissingValue("process.env.FILE_DB_URL");
if (process.env.ENV == null) throw new MissingValue("process.env.ENV");
if (process.env.PORT == null) throw new MissingValue("process.env.PORT");
if (process.env.S3_ACCESS_KEY == null)
  throw new MissingValue("process.env.S3_ACCESS_KEY");
if (process.env.S3_BUCKET_NAME == null)
  throw new MissingValue("process.env.S3_BUCKET_NAME");
if (process.env.S3_REGION == null)
  throw new MissingValue("process.env.S3_REGION");
if (process.env.S3_SECRET_KEY == null)
  throw new MissingValue("process.env.S3_SECRET_KEY");
if (process.env.S3_URL == null) throw new MissingValue("process.env.S3_URL");

export const {
  AUTH_TYPE,
  JWT_EXPIRATION_SECONDS,
  JWT_CLIENT_ID,
  JWT_CLIENT_SECRET,
  JWT_SECRET,
  JWT_ISSUER,
  JWT_ACCEPTED_ISSUERS,
  JWT_ALGORITHM,
  FILE_DB_URL,
  ENV,
  PORT,
  S3_ACCESS_KEY,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_SECRET_KEY,
  S3_URL,
} = process.env;
