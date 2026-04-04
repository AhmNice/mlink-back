import { ApiError } from '../utils/ApiError.js';
import prisma from '../config/database.js';
export class UserService {
  static async getUserStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationStatus: true },
      });
      return user || null;
    } catch (error) {
      console.error('Error fetching user status:', error);
      throw new ApiError(500, 'Failed to fetch user status');
    }
  }
}
