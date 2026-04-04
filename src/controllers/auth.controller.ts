import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthService } from '../services/auth.service.js';

const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;
  if (
    [email, password, firstName, lastName, phoneNumber].some((field) => !field)
  ) {
    throw new ApiError(400, 'All fields are required');
  }
  const { createdUser } = await AuthService.Register({
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});
const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
  const { accessToken, loggedInUser } = await AuthService.login({
    email,
    password,
    res,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken, user: loggedInUser },
        'Login successful',
      ),
    );
});
const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }
  const data = await AuthService.verifyOTP({ email, otp, res });
  return res
    .status(200)
    .json(new ApiResponse(200, data, 'OTP verified successfully'));
});
const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = await AuthService.refreshToken({
    req,
    res,
    refreshToken: req.cookies['M_LINK_REFRESH_TOKEN'],
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken }, 'Token refreshed successfully'),
    );
});
export { register, login, verifyOtp, refreshToken };
