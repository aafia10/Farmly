import { Router } from "express";
import { lotController } from "../controllers/lotController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, lotController.getLots);
router.get("/:id", optionalAuth, lotController.getLotById);
router.post("/", verifyAuth, lotController.createLot);
router.patch("/:id/status", verifyAuth, lotController.updateLotStatus);
router.get("/:id/lineage", optionalAuth, lotController.getLotLineage);
router.get("/:id/certificate", optionalAuth, lotController.getLotCertificate);

export default router;
