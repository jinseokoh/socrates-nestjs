import { CreateTableCommand, CreateTableInput } from '@aws-sdk/client-dynamodb';
import client from 'src/dynamodb/client';

const roomTableParams: CreateTableInput = {
  TableName: 'Rooms',
  KeySchema: [
    { AttributeName: 'room', KeyType: 'HASH' },
    // { AttributeName: "user", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: 'room', AttributeType: 'S' },
    // { AttributeName: "user", AttributeType: "S" },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 2,
    WriteCapacityUnits: 2,
  },
};

const command = new CreateTableCommand(roomTableParams);

export const migrateRooms = async () => {
  client
    .send(command)
    .then((r) => {
      console.log(r);
    })
    .catch((e) => {
      console.error(e);
    });
};
