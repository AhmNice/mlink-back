import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { Session } from './Session.js';
import bcrypt from 'bcrypt';
import { generateOtp } from '../utils/otp.js';
import { EmailService } from './email.js';
import { generateReferralCode } from '../utils/referralCode.js';

const Email_service = new EmailService();

export class AuthService {
  static async login({
    email,
    password,
    res,
  }: {
    email: string;
    password: string;
    res: Response;
  }) {
    try {
      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        throw new ApiError(404, 'User does not exist');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
      }

      const accessToken = await new Session({
        user_id: user.id,
        userName: user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : '',
        email: user.email,
        role: user.role,
        isAdmin: user.role && user.role === 'ADMIN',
      }).SignToken(res);
      const loggedInUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      };
      return { accessToken, loggedInUser };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Something went wrong');
    }
  }
  static async Register({
    email,
    password,
    phoneNumber,
    firstName,
    lastName,
  }: {
    email: string;
    password: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      if ([email, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'Email and password are required');
      }

      const existedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existedUser) {
        throw new ApiError(409, 'User with email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOtp();
      const referralCode = generateReferralCode(13);

      await Email_service.sendOTPEmail({
        email,
        otp,
        name: `${firstName} ${lastName}`,
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          phoneNumber: phoneNumber,
          verificationStatus: 'PENDING_OTP',
          otpCode: otp,
          otpLastSentAt: new Date(),
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
          referralCode,
        },
        include: {
          profile: true,
        },
      });

      const createdUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          role: true,
          profile: true,
          createdAt: true,
        },
      });

      if (!createdUser) {
        throw new ApiError(
          500,
          'Something went wrong while registering the user',
        );
      }
      return { createdUser };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      console.error('Error in Register:', error);
      throw new ApiError(
        500,
        'Something went wrong while registering the user',
      );
    }
  }
  static async verifyOTP({
    otp,
    email,
    phoneNumber,
    res,
  }: {
    otp: string;
    email?: string;
    phoneNumber?: string;
    res: Response;
  }) {
    if (!otp) throw new ApiError(400, 'OTP not provided');
    if (!email && !phoneNumber) {
      throw new ApiError(400, 'Email or phone number must be provided');
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          otpCode: otp,
          ...(email ? { email } : { phoneNumber }),
        },
      });

      if (!user || !user.otpCode) {
        throw new ApiError(400, 'Invalid or expired OTP');
      }

      const isExpired = user.otpExpiresAt && user.otpExpiresAt < new Date();

      if (isExpired) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCode: null,
            otpExpiresAt: null,
            otpAttempts: { increment: 1 },
          },
        });
        throw new ApiError(400, 'OTP has expired');
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpExpiresAt: null,
          otpAttempts: 0,
          verificationStatus: 'PENDING_DOCUMENTS',
        },
        include: { profile: true },
      });

      const accessToken = await new Session({
        user_id: updatedUser.id,
        userName: updatedUser.profile
          ? `${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`
          : '',
        email: updatedUser.email,
        role: updatedUser.role,
        isAdmin: updatedUser.role && updatedUser.role === 'ADMIN',
      }).SignToken(res);

      return { updatedUser, accessToken };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error verifying OTP:', error);
      throw new ApiError(500, 'Internal server error during verification');
    }
  }
  static async refreshToken({
    refreshToken,
    req,
    res,
  }: {
    refreshToken: string;
    req: Request;
    res: Response;
  }): Promise<string> {
    const refreshTokenProvided =
      refreshToken ||
      req.cookies['M_LINK_REFRESH_TOKEN'] ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!refreshTokenProvided) {
      throw new ApiError(401, 'Refresh token is missing');
    }
    try {
      const accessToken = await Session.refreshToken({
        refreshToken: refreshTokenProvided,
        res,
      });
      return accessToken;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to refresh token');
    }
  }
}
