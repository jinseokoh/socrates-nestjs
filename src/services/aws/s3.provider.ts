import { S3 } from '@aws-sdk/client-s3';
import { AWS_S3_CONNECTION } from 'src/common/constants';

export const S3Provider = [
  {
    provide: AWS_S3_CONNECTION,
    useFactory: () =>
      new S3({
        region: process.env.AWS_DEFAULT_REGION,
      }),
  },
];
