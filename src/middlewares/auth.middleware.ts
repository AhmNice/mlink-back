import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import prisma from '../config/database.js';
import { Session } from '../services/Session.js';

export const verifyJWT = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        throw new ApiError(401, 'Unauthorized request');
      }

      const decodedToken: any = jwt.verify(token, config.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decodedToken.id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new ApiError(401, 'Invalid Access Token');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(
        401,
        error instanceof Error ? error.message : 'Invalid access token',
      );
    }
  },
);
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Session.VerifyToken(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);
