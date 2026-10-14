import { Router } from "express";
import { certificateController } from "../controllers/certificateController";
import { optionalAuth, verifyAuth } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

// Mounted at /api/v1/certificates
export const certificateRoutes = Router();
certificateRoutes.post("/origin", verifyAuth, requireRoles("farmer", "helper"), certificateController.createOrigin);
certificateRoutes.get("/:id", optionalAuth, certificateController.getCertificate);
certificateRoutes.get("/:id/document", optionalAuth, certificateController.getDocument);
certificateRoutes.post("/:id/verify", optionalAuth, certificateController.verify);
certificateRoutes.post("/:id/retry", verifyAuth, certificateController.retry);
certificateRoutes.post("/:id/revoke", verifyAuth, certificateController.revoke);

// Mounted at /api/v1/purchases
export const purchaseRoutes = Router();
purchaseRoutes.post("/", verifyAuth, requireRoles("distributor", "retailer"), certificateController.createPurchase);
purchaseRoutes.post("/:id/retry", verifyAuth, requireRoles("distributor", "retailer"), certificateController.retryPurchase);

// Mounted at /api/v1/traceability
export const traceabilityRoutes = Router();
traceabilityRoutes.get("/available", verifyAuth, certificateController.available);
traceabilityRoutes.get("/dashboard", verifyAuth, certificateController.dashboard);
traceabilityRoutes.get("/batches/:id", verifyAuth, certificateController.batchTrace);
traceabilityRoutes.get("/public/:id", certificateController.publicTrace);
traceabilityRoutes.get("/qr/:id", certificateController.qr);
