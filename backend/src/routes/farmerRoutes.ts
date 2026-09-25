import { Router } from "express";
import { farmerController } from "../controllers/farmerController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, farmerController.getFarmers);
router.get("/:id", optionalAuth, farmerController.getFarmerById);
router.post("/", verifyAuth, farmerController.createFarmer);

export default router;
