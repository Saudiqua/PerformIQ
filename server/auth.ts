import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  // Attach user info to request
  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role as any,
  } as User;

  next();
}
