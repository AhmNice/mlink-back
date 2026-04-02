import { Router } from "express";

const userRouter = Router();

// Placeholder for user routes
userRouter.get("/", (req, res) => {
  res.send("User list");
});

export { userRouter };
