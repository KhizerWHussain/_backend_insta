import { config } from 'dotenv';
config();

const AppConfig = {
  APP: {
    PORT: Number(process.env.APP_PORT),
    LOG_LEVEL: Number(process.env.APP_LOG_LEVEL),
  },
  DATABASE: {
    URL: process.env.DATABASE_URL,
  },
  // REDIS: {
  //   HOST: process.env.APP_REDIS_HOST,
  //   PORT: Number(process.env.APP_REDIS_PORT),
  // },
};

export default AppConfig;
