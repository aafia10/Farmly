import { Router } from "express";
import { ivrController } from "../controllers/ivrController";
import { verifyAuth } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

// Twilio webhooks (authenticated by X-Twilio-Signature, not by user tokens).
router.post("/twilio/voice", ivrController.twilioGuard, ivrController.twilioVoice);
router.post("/twilio/turn", ivrController.twilioGuard, ivrController.twilioTurn);
router.post("/twilio/turn-result", ivrController.twilioGuard, ivrController.twilioTurnResult);
router.post("/twilio/mobile", ivrController.twilioGuard, ivrController.twilioMobile);
router.post("/twilio/dial-status", ivrController.twilioGuard, ivrController.twilioDialStatus);
router.post("/twilio/status", ivrController.twilioGuard, ivrController.twilioStatus);

// Prompt audio (content-hash IDs) fetched by Twilio <Play> and the simulator.
router.get("/audio/:file", ivrController.audio);

// Helper workspace: call sessions, retry, and the local call simulator.
const helperOnly = [verifyAuth, requireRoles("helper")];
router.get("/config", ...helperOnly, ivrController.config);
router.get("/sessions", ...helperOnly, ivrController.listSessions);
router.get("/sessions/:id", ...helperOnly, ivrController.getSession);
router.post("/sessions/:id/retry", ...helperOnly, ivrController.retry);
router.post("/sim/sessions", ...helperOnly, ivrController.simStart);
router.post("/sim/sessions/:id/turn", ...helperOnly, ivrController.simTurn);

export default router;
