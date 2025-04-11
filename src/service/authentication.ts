import {
  Client,
  Token,
  ClientCredentialsModel,
  User,
} from "@node-oauth/oauth2-server"; // Warn: types of this lib are completely screw
import { missingValue } from "../library/error";

if (process.env.AUTHENTICATION_ID == null)
  throw missingValue("process.env.AUTHENTICATION_ID", new Error());
if (process.env.AUTHENTICATION_KEY == null)
  throw missingValue("process.env.AUTHENTICATION_KEY", new Error());
const { AUTHENTICATION_ID, AUTHENTICATION_KEY } = process.env;

type ClientExtended = Client & { secret: string; user: { name: string } };

// WARN: there are a trouble with oAuth2 needs.
// we need to speak about a notmalization between services.
// credentials are only saved into RAM for now: bad practice.

const savedClients: ClientExtended[] = [
  {
    id: AUTHENTICATION_ID,
    secret: AUTHENTICATION_KEY,
    grants: ["client_credentials"],
    user: { name: "Portalis" },
  },
];
let savedTokens: Token[] = [];

export function validateBasic(
  clientId: string,
  clientSecret: string
): ClientExtended | false {
  const client = savedClients.find((_) => _.id === clientId);
  if (client && clientSecret === client.secret) return client;
  return false;
}

function getClient(
  clientId: string,
  clientSecret: string
): Promise<ClientExtended | false> {
  return Promise.resolve(validateBasic(clientId, clientSecret));
}

function saveToken(
  token: Token,
  client: ClientExtended,
  user: User
): Promise<Token> {
  const index = savedTokens.findIndex((_) => _.client.id === client.id);

  if (index === -1) savedTokens = [...savedTokens, { ...token, user, client }];
  else savedTokens[index] = { ...token, user, client };

  return Promise.resolve({ ...token, user, client });
}

function getAccessToken(accessToken: string): Promise<Token | undefined> {
  const savedToken = savedTokens.find((_) => _.accessToken === accessToken);
  return Promise.resolve(savedToken);
}

function getUserFromClient(client: ClientExtended): Promise<User> {
  return Promise.resolve(client.user);
}

export const validateOAuth: ClientCredentialsModel = {
  getClient,
  saveToken,
  getAccessToken,
  getUserFromClient,
};
