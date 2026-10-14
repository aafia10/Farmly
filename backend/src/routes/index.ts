import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase";
import authRoutes from "./authRoutes";
import farmerRoutes from "./farmerRoutes";
import cropRoutes from "./cropRoutes";
import lotRoutes from "./lotRoutes";
import evidenceRoutes from "./evidenceRoutes";
import qualityRoutes from "./qualityRoutes";
import collectionRoutes from "./collectionRoutes";
import fpoRoutes from "./fpoRoutes";
import marketplaceRoutes from "./marketplaceRoutes";
import offerRoutes from "./offerRoutes";
import paymentRoutes from "./paymentRoutes";
import disputeRoutes from "./disputeRoutes";
import transactionRoutes from "./transactionRoutes";
import notificationRoutes from "./notificationRoutes";
import helperRoutes from "./helperRoutes";
import adminRoutes from "./adminRoutes";
import mandiRoutes from "./mandiRoutes";
import agrosathiRoutes from "./agrosathiRoutes";
import { certificateRoutes, purchaseRoutes, traceabilityRoutes } from "./certificateRoutes";

const apiRouter = Router();

// Platform Health Check
apiRouter.get("/health", async (req: Request, res: Response) => {
  let dbStatus = "connected";
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) dbStatus = `error: ${error.message}`;
  } catch (err: any) {
    dbStatus = `unreachable: ${err.message}`;
  }

  res.json({
    status: "healthy",
    service: "Farmly REST API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Domain Routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/farmers", farmerRoutes);
apiRouter.use("/crop-availability", cropRoutes);
apiRouter.use("/lots", lotRoutes);
apiRouter.use("/evidence", evidenceRoutes);
apiRouter.use("/quality", qualityRoutes);
apiRouter.use("/collection", collectionRoutes);
apiRouter.use("/fpo", fpoRoutes);
apiRouter.use("/marketplace", marketplaceRoutes);
apiRouter.use("/offers", offerRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/disputes", disputeRoutes);
apiRouter.use("/transactions", transactionRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/helper", helperRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/mandi", mandiRoutes);
apiRouter.use("/agrosathi", agrosathiRoutes);
apiRouter.use("/certificates", certificateRoutes);
apiRouter.use("/purchases", purchaseRoutes);
apiRouter.use("/traceability", traceabilityRoutes);

export default apiRouter;
