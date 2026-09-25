import { Router } from "express";
import { collectionController } from "../controllers/collectionController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/arrivals", optionalAuth, collectionController.getArrivals);
router.post("/arrivals", verifyAuth, collectionController.createArrival);

export default router;
