process.env = {
  ...process.env,
  ENV: 'test',
  PORT: '3015',
  JWT_CLIENT_ID: 'jest-client-id',
  JWT_CLIENT_SECRET: 'jest-client-secret',
  JWT_SECRET: 'jest-secret',
  JWT_ISSUER: 'jest-issuer',
  JWT_ACCEPTED_ISSUERS: 'jest-issuer,jest-issuer-other',
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION_SECONDS: '3600',
  FILE_DB_URL: 'mongodb://useless',
  S3_URL: 'http://localhost:9000',
  S3_ACCESS_KEY: 'test-access-key',
  S3_SECRET_KEY: 'test-secret-key',
  S3_REGION: 'eu-west-paris-1',
  S3_BUCKET_NAME: 'test-bucket'
}
