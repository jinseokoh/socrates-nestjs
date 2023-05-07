import 'dotenv/config';

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV,
  appPort: Number(process.env.APP_PORT ?? '4001'),
  timeZone: process.env.TIME_ZONE,
  database: {
    engine: process.env.DB_ENGINE ?? 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dbname: process.env.DB_NAME ?? 'meso',
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'secret',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  },
  jwt: {
    authSecret: process.env.AUTH_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_SECRET,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    defaultRegion: process.env.AWS_DEFAULT_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
    cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
    dbSecretsArn: process.env.MYSQL_SECRETS_ARN,
  },
  naver: {
    accessKey: process.env.NAVER_ACCESS_KEY,
    secretKey: process.env.NAVER_SECRET_KEY,
    smsServiceId: process.env.NAVER_SMS_SERVICE_ID,
    smsSecretKey: process.env.NAVER_SMS_SECRET_KEY,
    smsPhoneNumber: process.env.NAVER_SMS_PHONE_NUMBER,
    alimtalkServiceId: process.env.NAVER_ALIMTALK_SERVICE_ID,
    plusFriendId: process.env.NAVER_PLUS_FRIEND_ID,
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
  iamport: {
    merchantId: process.env.IAMPORT_MERCHANT_ID,
    apiKey: process.env.IAMPORT_API_KEY,
    apiSecret: process.env.IAMPORT_API_SECRET,
  },
  rabbitmq: {
    user: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
    host: process.env.RABBITMQ_HOST,
    queue: process.env.RABBITMQ_QUEUE,
  },
});
