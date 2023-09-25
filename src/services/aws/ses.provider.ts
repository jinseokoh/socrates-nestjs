import { SES } from '@aws-sdk/client-ses';
import { AWS_SES_CONNECTION } from 'src/common/constants';

//! not being used
export const SesProvider = [
  {
    provide: AWS_SES_CONNECTION,
    useFactory: () =>
      new SES({
        apiVersion: '2010-12-01',
      }),
  },
];
