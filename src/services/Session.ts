import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import config from '../config/config.js';
import { SessionPayload } from '../interface/auth.interface.js';
import { ApiError } from '../utils/ApiError.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}

export class Session {
  constructor(private payload: SessionPayload) {
    Object.assign(this, payload);
  }

  private refreshToken: string = '';

  async SignToken(res: Response): Promise<void> {
    const refreshToken = jwt.sign(this.payload, config.REFRESH_TOKEN_SECRET!, {
      expiresIn: '7d',
    });

    const accessToken = jwt.sign(this.payload, config.ACCESS_TOKEN_SECRET!, {
      expiresIn: '15m',
    });

    const encryptedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.refreshToken.create({
      data: {
        token: encryptedRefreshToken,
        userId: this.payload.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.refreshToken = refreshToken;

    res.cookie('M_LINK_REFRESH_TOKEN', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('M_LINK_ACCESS_TOKEN', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
  }

  static async VerifyToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = req.cookies['M_LINK_ACCESS_TOKEN'];

    if (!token) {
      throw new ApiError(401, 'Access token is missing');
    }

    try {
      const decoded = jwt.verify(
        token,
        config.ACCESS_TOKEN_SECRET!,
      ) as SessionPayload;

      req.user = decoded;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const refreshToken = req.cookies['M_LINK_REFRESH_TOKEN'];

        if (!refreshToken) {
          throw new ApiError(401, 'Refresh token is missing');
        }

        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            config.REFRESH_TOKEN_SECRET!,
          ) as SessionPayload;

          const storedTokens = await prisma.refreshToken.findMany({
            where: {
              userId: decodedRefresh.user_id,
              expiresAt: { gt: new Date() },
              revokedAt: null,
            },
          });

          if (!storedTokens || storedTokens.length === 0) {
            throw new ApiError(401, 'Invalid refresh token');
          }

          let matchToken = null;

          for (const t of storedTokens) {
            const isMatch = await bcrypt.compare(refreshToken, t.token);
            if (isMatch) {
              matchToken = t;
              break;
            }
          }

          if (!matchToken) {
            throw new ApiError(401, 'Invalid refresh token');
          }

          if (matchToken.revokedAt) {
            await prisma.refreshToken.updateMany({
              where: { userId: decodedRefresh.user_id },
              data: { revokedAt: new Date() },
            });

            throw new ApiError(403, 'Token reuse detected');
          }

          await prisma.refreshToken.update({
            where: { id: matchToken.id },
            data: { revokedAt: new Date() },
          });

          const newSession = new Session(decodedRefresh);
          await newSession.SignToken(res);

          req.user = decodedRefresh;
          return next();
        } catch {
          throw new ApiError(401, 'Invalid refresh token');
        }
      }

      throw new ApiError(401, 'Invalid token');
    }
  }

  static async Destroy(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies['M_LINK_REFRESH_TOKEN'];

      if (!refreshToken) return;

      const decoded: any = jwt.decode(refreshToken);

      if (!decoded?.user_id) return;

      const storedTokens = await prisma.refreshToken.findMany({
        where: {
          userId: decoded.user_id,
          revokedAt: null,
        },
      });

      let matchedToken = null;

      for (const t of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, t.token);
        if (isMatch) {
          matchedToken = t;
          break;
        }
      }

      if (matchedToken) {
        await prisma.refreshToken.update({
          where: { id: matchedToken.id },
          data: { revokedAt: new Date() },
        });
      }

      res.clearCookie('M_LINK_REFRESH_TOKEN', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      res.clearCookie('M_LINK_ACCESS_TOKEN', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      return;
    } catch {
      throw new ApiError(500, 'Something went wrong');
    }
  }
}
