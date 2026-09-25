import { Router } from "express";
import { qualityController } from "../controllers/qualityController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/assessments", optionalAuth, qualityController.getAssessments);
router.post("/assessments", verifyAuth, qualityController.createAssessment);

export default router;
