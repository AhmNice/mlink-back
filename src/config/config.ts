import dotenv from 'dotenv';
dotenv.config({
  quiet: true,
});
interface config {
  PORT: number;
  DB_URL: string;
  JWT_SECRET: string;
  CLIENT_URL: string;
  CLIENT_URL_PROD: string;
  CLIENT_URL_DEV: string;
}
const config: config = {
  PORT: Number(process.env.PORT) || 5000,
  DB_URL: process.env.DB_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || '',
  CLIENT_URL_PROD: process.env.CLIENT_URL_PROD || '',
  CLIENT_URL_DEV: process.env.CLIENT_URL_DEV || '',
};
export default config;
