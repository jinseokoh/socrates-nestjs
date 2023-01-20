import { CreateTableCommand, CreateTableInput } from '@aws-sdk/client-dynamodb';
import client from 'src/dynamodb/client';

const userTableParams: CreateTableInput = {
  TableName: 'Users',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 2,
    WriteCapacityUnits: 2,
  },
};

const command = new CreateTableCommand(userTableParams);

export const migrateUsers = async () => {
  client
    .send(command)
    .then((r) => {
      console.log(r);
    })
    .catch((e) => {
      console.error(e);
    });
};
