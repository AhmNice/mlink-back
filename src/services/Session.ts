import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import config from '../config/config.js';
import { SessionPayload } from '../interface/auth.interface.js';
import { ApiError } from '../utils/ApiError.js';
import crypto from 'crypto';
declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}
export class Session {
  constructor(private payload: SessionPayload) {}

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async SignToken(res: Response): Promise<string> {
    const tokenId = crypto.randomUUID();

    const refreshToken = jwt.sign(
      { ...this.payload, tokenId },
      config.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    const accessToken = jwt.sign(this.payload, config.ACCESS_TOKEN_SECRET!, {
      expiresIn: '15m',
    });

    const tokenHash = Session.hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: tokenHash,
        userId: this.payload.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    res.cookie('M_LINK_REFRESH_TOKEN', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('M_LINK_ACCESS_TOKEN', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    return accessToken;
  }

  static async VerifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies['M_LINK_ACCESS_TOKEN'];

    if (!token) {
      return Session.handleAutomaticRefresh(req, res, next);
    }

    try {
      const decoded = jwt.verify(
        token,
        config.ACCESS_TOKEN_SECRET!,
      ) as SessionPayload;
      req.user = decoded;
      return next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return Session.handleAutomaticRefresh(req, res, next);
      }
      throw new ApiError(401, 'Invalid session');
    }
  }

  private static async handleAutomaticRefresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const refreshToken = req.cookies['M_LINK_REFRESH_TOKEN'];
    if (!refreshToken) throw new ApiError(401, 'Session expired');

    try {
      await Session.refreshToken({ refreshToken, res });
      // After refresh, the user payload is available in the new token
      const decoded = jwt.decode(
        req.cookies['M_LINK_ACCESS_TOKEN'],
      ) as SessionPayload;
      req.user = decoded;
      return next();
    } catch {
      throw new ApiError(401, 'Please log in again');
    }
  }

  static async refreshToken({
    refreshToken,
    res,
  }: {
    refreshToken: string;
    res: Response;
  }): Promise<string> {
    try {
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token missing');
      }
      const decoded = jwt.verify(
        refreshToken,
        config.REFRESH_TOKEN_SECRET!,
      ) as any;
      const currentHash = Session.hashToken(refreshToken);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { id: decoded.tokenId },
      });

      if (
        !storedToken ||
        storedToken.revokedAt ||
        storedToken.token !== currentHash
      ) {
        // If the token is valid JWT but not in DB, it might be a stolen replayed token
        if (storedToken) {
          await prisma.refreshToken.updateMany({
            where: { userId: decoded.user_id },
            data: { revokedAt: new Date() },
          });
        }
        throw new ApiError(401, 'Security alert: Token reuse detected');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new ApiError(401, 'Refresh token expired');
      }

      await prisma.refreshToken.delete({ where: { id: decoded.tokenId } });

      const session = new Session({
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        userName: decoded.userName,
        isAdmin: decoded.isAdmin,
      });
      return await session.SignToken(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.log('Error during token refresh:', error);
      throw new ApiError(401, 'Invalid refresh attempt');
    }
  }

  static async Destroy(req: Request, res: Response) {
    const refreshToken = req.cookies['M_LINK_REFRESH_TOKEN'];
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken) as any;
        if (decoded?.tokenId) {
          await prisma.refreshToken.deleteMany({
            where: { id: decoded.tokenId },
          });
        }
      } catch {
        /* ignore */
      }
    }

    res.clearCookie('M_LINK_REFRESH_TOKEN');
    res.clearCookie('M_LINK_ACCESS_TOKEN');
    res.status(200).json({ message: 'Logged out' });
  }
}
