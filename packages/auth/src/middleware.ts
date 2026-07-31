import { Request, Response, NextFunction } from "express";
import { APP_ACCESS, STAFF_SECTIONS, type Role } from "./rbac.js";

export interface GatewayUser {
  id: string;
  email: string;
  userType: string;
}

export function extractUser(req: Request): GatewayUser | null {
  const id = req.headers["x-user-id"] as string;
  const email = req.headers["x-user-email"] as string;
  const userType = req.headers["x-user-type"] as string;

  if (!id || !userType) return null;

  return { id, email, userType };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      data: { message: "Unauthenticated request" },
    });
  }
  (req as any).user = user;
  next();
}

export function requireUserType(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = extractUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: { message: "Unauthenticated request" },
      });
    }
    if (!allowed.includes(user.userType)) {
      return res.status(403).json({
        success: false,
        data: { message: "Forbidden: insufficient role" },
      });
    }
    (req as any).user = user;
    next();
  };
}

// Derived from `rbac.ts` rather than hardcoded, so these can never drift from
// the role lists the SvelteKit apps enforce.
export const requireStaff = requireUserType(...APP_ACCESS.staff);
export const requireAdmin = requireUserType("admin" satisfies Role);
export const requireReceptionist = requireUserType(...STAFF_SECTIONS.receptionist);
export const requireBarista = requireUserType(...STAFF_SECTIONS.barista);
export const requireWaiter = requireUserType(...STAFF_SECTIONS.waiter);
