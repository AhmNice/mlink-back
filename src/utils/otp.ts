import crypto from 'crypto';

export const generateOtp = (length: number = 6): string => {
  if (length <= 0 || length > 10) throw new Error('OTP length must be 1-10');

  const max = 10 ** length;
  const otp = crypto.randomInt(0, max);

  return otp.toString().padStart(length, '0');
};
