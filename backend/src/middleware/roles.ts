import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role === "admin" || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Required role: [${allowedRoles.join(", ")}], but current role is '${req.user.role}'`,
    });
  };
}
