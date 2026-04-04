import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const userVerificationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { user_id } = req.user!;
    const status = await UserService.getUserStatus(user_id);
    if (!status) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          status,
          'User verification status fetched successfully',
        ),
      );
  },
);
export { userVerificationStatus };
