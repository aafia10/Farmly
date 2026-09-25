import { Router } from "express";
import { cropController } from "../controllers/cropController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, cropController.getCropAvailabilities);
router.post("/", verifyAuth, cropController.createCropAvailability);

export default router;
