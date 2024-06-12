import { randomBytes } from 'crypto';

export const generateOTP = (length: number): string => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes(1)[0] % digits.length;
      OTP += digits[randomIndex];
  }

  return OTP;
};