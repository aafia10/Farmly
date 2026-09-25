import { Router } from "express";
import { fpoController } from "../controllers/fpoController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/members", optionalAuth, fpoController.getMembers);
router.get("/mixed-lots", optionalAuth, fpoController.getMixedLots);
router.post("/mixed-lots", verifyAuth, fpoController.createMixedLot);

export default router;
