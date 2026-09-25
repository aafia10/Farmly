import { Router } from "express";
import { authController } from "../controllers/authController";
import { verifyAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", verifyAuth, authController.getMe);
router.put("/profile", verifyAuth, authController.updateProfile);

export default router;
