import { CreateTableCommand, CreateTableInput } from '@aws-sdk/client-dynamodb';
import client from 'src/dynamodb/client';

const messageTableParams: CreateTableInput = {
  TableName: 'Messages',
  KeySchema: [
    { AttributeName: 'room', KeyType: 'HASH' },
    { AttributeName: 'msid', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'room', AttributeType: 'S' },
    { AttributeName: 'msid', AttributeType: 'S' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 2,
    WriteCapacityUnits: 2,
  },
};

const command = new CreateTableCommand(messageTableParams);
client
  .send(command)
  .then((r) => {
    console.log(r);
  })
  .catch((e) => {
    console.error(e);
  });
