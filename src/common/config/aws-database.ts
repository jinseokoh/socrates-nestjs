import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces/index';

export const getAwsDatabaseConfig = async (
  awsConfig: IAwsConfig,
): Promise<IDatabaseConfig> => {
  const client = new SecretsManagerClient({
    region: awsConfig.defaultRegion,
  });
  const command = new GetSecretValueCommand({
    SecretId: awsConfig.dbSecretsArn,
  });
  const { SecretString } = await client.send(command);
  return JSON.parse(SecretString) as IDatabaseConfig;
};
