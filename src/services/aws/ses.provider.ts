import { config, SES } from 'aws-sdk';
import { AWS_SES_CONNECTION } from 'src/common/constants';

export const SesProvider = [
  {
    provide: AWS_SES_CONNECTION,
    useFactory: () => {
      config.update({ region: process.env.AWS_DEFAULT_REGION });
      return new SES({
        apiVersion: '2010-12-01',
      });
    },
  },
];
