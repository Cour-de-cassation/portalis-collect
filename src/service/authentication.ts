import * as jwt from "jsonwebtoken";
import { missingValue } from "../library/error";

if (process.env.AUTHENTICATION_ID == null)
  throw missingValue("process.env.AUTHENTICATION_ID", new Error());
if (process.env.AUTHENTICATION_KEY == null)
  throw missingValue("process.env.AUTHENTICATION_KEY", new Error());
if (process.env.HASH_KEY == null)
  throw missingValue("process.env.HASH_KEY", new Error());
const { AUTHENTICATION_ID, AUTHENTICATION_KEY } = process.env;

export function validateBasic(clientId: string, clientSecret: string) {
  return clientId === AUTHENTICATION_ID && clientSecret === AUTHENTICATION_KEY;
}
