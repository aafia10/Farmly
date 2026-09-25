import { Router } from "express";
import { marketplaceController } from "../controllers/marketplaceController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, marketplaceController.getListings);

export default router;
