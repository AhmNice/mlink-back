import { Router } from 'express';
import { userVerificationStatus } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const userRouter = Router();

// Placeholder for user routes
userRouter.get('/', (req, res) => {
  res.send('User list');
});
userRouter.get('/me/status', protect, userVerificationStatus);

export { userRouter };
