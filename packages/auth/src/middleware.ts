import { Request, Response, NextFunction } from "express";

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

export const requireStaff = requireUserType(
  "receptionist",
  "barista",
  "waiter",
  "management"
);
export const requireAdmin = requireUserType("management");
export const requireReceptionist = requireUserType("receptionist", "management");
export const requireBarista = requireUserType("barista", "management");
export const requireWaiter = requireUserType("waiter", "management");
