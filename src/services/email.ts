import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/config.js';
import { sender } from '../config/mail.config.js';
import { generateOTP_Email_Template } from '../mail/template.js';

interface MailArgs {
  email: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: Transporter;
  private sender: string = sender || `Market-Link <${config.SMTP_USER}>`;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.SMTP_SERVICE,
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
    this.transporter
      .verify()
      .then(() => {
        console.log('SMTP transporter is ready');
      })
      .catch((err) => {
        console.error('Error setting up SMTP transporter:', err);
      });
  }
  private mailOption({ email, subject, html }: MailArgs) {
    return {
      from: this.sender,
      to: email,
      subject,
      html,
    };
  }
  async sendOTPEmail({
    email,
    otp,
    name,
  }: {
    email: string;
    otp: string;
    name: string;
  }): Promise<void> {
    const subject = 'Account Verification OTP';
    const html = generateOTP_Email_Template({ otp, name });
    const mailOptions = this.mailOption({ email, subject, html });

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }
}
