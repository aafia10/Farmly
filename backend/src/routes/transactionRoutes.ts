import { Router } from "express";
import { transactionController } from "../controllers/transactionController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, transactionController.getTransactions);

export default router;
