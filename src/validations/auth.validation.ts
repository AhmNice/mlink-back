import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be at most 15 digits'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      otp: z.string().min(1, 'OTP is required'),
      phoneNumber: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must be at most 15 digits')
        .optional(),
    })
    .refine((data) => data.email || data.phoneNumber, {
      message: 'Either email or phone number is required',
      path: ['email', 'phoneNumber'],
    }),
});
