import { Router } from "express";
import { helperController } from "../controllers/helperController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/activities", optionalAuth, helperController.getActivities);
router.post("/activities", verifyAuth, helperController.createActivity);

export default router;
