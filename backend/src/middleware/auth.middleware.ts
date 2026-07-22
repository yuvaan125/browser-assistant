import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth.service";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Missing Authorization header."
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const user = await verifyAccessToken(token);

    (req as Request & { user?: unknown }).user = user;

    next();

  } catch {

    return res.status(401).json({
      success: false,
      error: "Invalid session."
    });

  }

}