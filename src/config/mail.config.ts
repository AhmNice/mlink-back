import nodemailer from 'nodemailer';
import config from './config.js';

export const transporter = nodemailer.createTransport({
  service: `${config.SMTP_SERVICE}`,
  host: `${config.SMTP_HOST}`,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: `${config.SMTP_USER}`,
    pass: `${config.SMTP_PASS}`,
  },
});
export const sender = `Market-Link <${config.SMTP_USER}>`;
