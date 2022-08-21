import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

interface IDbConfig {
  engine: string;
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}

export const getDbConfig = async (env: string): Promise<IDbConfig> => {
  if (env === 'local') {
    return {
      engine: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      dbname: process.env.DB_NAME,
    } as IDbConfig;
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_DEFAULT_REGION,
  });
  const command = new GetSecretValueCommand({
    SecretId: process.env.AWS_DB_SECRET_ARN,
  });
  const { SecretString } = await client.send(command);
  return JSON.parse(SecretString) as IDbConfig;
};
