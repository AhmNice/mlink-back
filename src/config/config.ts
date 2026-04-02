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
}
const config: config = {
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || '',
  CLIENT_URL_PROD: process.env.CLIENT_URL_PROD || '',
  CLIENT_URL_DEV: process.env.CLIENT_URL_DEV || '',
};
export default config;
