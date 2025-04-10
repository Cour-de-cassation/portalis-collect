import {
  Client,
  Token,
  ClientCredentialsModel,
  User,
} from "@node-oauth/oauth2-server";
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

// WARN: there are a trouble with oAuth2 needs.
// we need to speak about a notmalization between services.
// tokens are only saved into RAM for now: bad practice.
let savedTokens: { token: Token; client: Client; user: User }[] = [];

function getClient(clientId: string, clientSecret: string) {
  return Promise.resolve(
    validateBasic(clientId, clientSecret)
      ? {
          id: "Portalis",
          grants: ["client_credentials"],
        }
      : undefined
  );
}

function saveToken(token: Token, client: Client, user: User) {
  const index = savedTokens.findIndex((_) => _.client.id === client.id);

  if (index === -1) savedTokens = [...savedTokens, { token, client, user }];
  else savedTokens[index] = { token, client, user };

  return Promise.resolve(token);
}

function getAccessToken(accessToken: string) {
  const savedToken = savedTokens.find(
    (_) => _.token.accessToken === accessToken
  );
  return Promise.resolve(savedToken?.token);
}

function getUserFromClient(client: Client) {
  const savedToken = savedTokens.find((_) => _.client.id === client.id);
  return Promise.resolve(savedToken?.user);
}

export const validateOAuth: ClientCredentialsModel = {
  getClient,
  saveToken,
  getAccessToken,
  getUserFromClient,
};
