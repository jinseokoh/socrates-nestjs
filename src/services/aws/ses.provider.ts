import { SES } from '@aws-sdk/client-ses';
import { AWS_SES_CONNECTION } from 'src/common/constants';

export const SesProvider = [
  {
    provide: AWS_SES_CONNECTION,
    useFactory: () =>
      new SES({
        apiVersion: '2010-12-01',
      }),
  },
];
