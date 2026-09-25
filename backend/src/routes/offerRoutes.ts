import { Router } from "express";
import { offerController } from "../controllers/offerController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, offerController.getOffers);
router.get("/:id", optionalAuth, offerController.getOfferById);
router.post("/", verifyAuth, offerController.createOffer);
router.post("/:id/accept", verifyAuth, offerController.acceptOffer);
router.post("/:id/reject", verifyAuth, offerController.rejectOffer);

export default router;
