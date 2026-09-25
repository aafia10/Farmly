import { Router } from "express";
import { evidenceController } from "../controllers/evidenceController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, evidenceController.getEvidence);
router.post("/", verifyAuth, evidenceController.addEvidence);
router.patch("/:id/status", verifyAuth, evidenceController.updateEvidenceStatus);

export default router;
