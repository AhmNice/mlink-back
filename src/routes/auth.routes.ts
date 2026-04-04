import { Router } from 'express';
import {
  register,
  login,
  verifyOtp,
  refreshToken,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} from '../validations/auth.validation.js';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
authRouter.post('/refresh', refreshToken);

export { authRouter };
