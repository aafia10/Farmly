import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, notificationController.getNotifications);
router.patch("/:id/read", verifyAuth, notificationController.markAsRead);
router.post("/read-all", verifyAuth, notificationController.markAllAsRead);

export default router;
