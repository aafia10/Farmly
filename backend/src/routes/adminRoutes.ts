import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/alerts", optionalAuth, adminController.getAlerts);
router.patch("/alerts/:id/resolve", verifyAuth, adminController.resolveAlert);

export default router;
