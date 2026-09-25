import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { optionalAuth, verifyAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, paymentController.getPayments);
router.get("/:id", optionalAuth, paymentController.getPaymentById);
router.patch("/:id/stage", verifyAuth, paymentController.updatePaymentStage);

export default router;
