import { Router, Request, Response } from "express";
import { mandiService } from "../services/mandiService";

const router = Router();

router.get("/benchmarks", (req: Request, res: Response) => {
  const benchmarks = mandiService.getBenchmarks();
  res.json({
    success: true,
    data: benchmarks,
  });
});

export default router;
