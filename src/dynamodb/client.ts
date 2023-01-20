import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// https://medium.com/swlh/use-dynamodb-in-nestjs-application-with-serverless-framework-on-aws-85db02b24a34

const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2',
  endpoint: 'http://localhost:8000',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export default docClient;
