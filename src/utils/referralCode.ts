import { randomBytes } from 'crypto';

export const generateReferralCode = (length: number = 10): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const prefix = 'MLNK-';

  const randomLength = Math.max(0, length - prefix.length);

  if (randomLength === 0) return prefix;

  const rb = randomBytes(randomLength);
  let result = prefix;

  for (let i = 0; i < randomLength; i++) {
    result += chars[rb[i] % chars.length];
  }

  return result;
};
