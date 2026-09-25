import { Router, Request, Response } from "express";
import { agrosathiService } from "../services/agrosathiService";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.post("/query", optionalAuth, (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query) {
    res.status(400).json({ success: false, message: "Query string is required" });
    return;
  }

  const result = agrosathiService.processFarmerQuery(query, req.user);

  res.json({
    success: true,
    data: result,
  });
});

export default router;
