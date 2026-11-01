import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";
import { AppError } from "../errors/app-error";
import { Permission, hasPermission } from "../constants/permissions";

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    // Admins can do anything
    if (req.user.role === "administrator") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
    }

    next();
  };
};

export default requireRole;
