import dotenv from 'dotenv';
dotenv.config({
  quiet: true,
});
interface config {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLIENT_URL: string;
  CLIENT_URL_PROD: string;
  CLIENT_URL_DEV: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_SECRET: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SERVICE?: string;
}
const config: config = {
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || '',
  CLIENT_URL_PROD: process.env.CLIENT_URL_PROD || '',
  CLIENT_URL_DEV: process.env.CLIENT_URL_DEV || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET
    ? process.env.REFRESH_TOKEN_SECRET
    : '',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
    ? process.env.ACCESS_TOKEN_SECRET
    : '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SERVICE: process.env.SMTP_SERVICE || '',
};
export default config;
