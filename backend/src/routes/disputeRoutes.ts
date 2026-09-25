import { Router } from "express";
import { disputeController } from "../controllers/disputeController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, disputeController.getDisputes);
router.get("/:id", optionalAuth, disputeController.getDisputeById);
router.post("/", verifyAuth, disputeController.createDispute);
router.patch("/:id/status", verifyAuth, disputeController.updateDisputeStatus);

export default router;
