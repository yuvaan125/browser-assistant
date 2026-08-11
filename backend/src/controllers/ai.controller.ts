import { Request, Response } from "express";
import { processAIRequest } from "../services/ai.service";
import { getOrCreateUser } from "../services/user.service";
import { recordUsage, getUsageCountSince } from "../services/usage.service";
import { DAILY_REQUEST_LIMIT } from "../utils/constants";
import { AIRequest } from "../types";

interface AuthedUser {
  id: string;
  email?: string;
}

function windowStart(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export async function explain(
  req: Request,
  res: Response
) {
  try {

    const authedUser = (req as Request & { user?: AuthedUser }).user;

    if (!authedUser) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated.",
      });
    }

    const request = req.body as AIRequest;

    const user = await getOrCreateUser(authedUser);

    const usageCount = await getUsageCountSince(user.id, windowStart());

    if (usageCount >= DAILY_REQUEST_LIMIT) {
      return res.status(429).json({
        success: false,
        error: "Daily limit reached. Try again later.",
      });
    }

    const result = await processAIRequest(request);

    await recordUsage(user.id, request.action);

    return res.json({
      success: true,
      result,
    });

  } catch (error: unknown) {

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

  }
}

export async function usage(
  req: Request,
  res: Response
) {
  try {

    const authedUser = (req as Request & { user?: AuthedUser }).user;

    if (!authedUser) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated.",
      });
    }

    const user = await getOrCreateUser(authedUser);

    const used = await getUsageCountSince(user.id, windowStart());

    return res.json({
      success: true,
      used,
      limit: DAILY_REQUEST_LIMIT,
      remaining: Math.max(0, DAILY_REQUEST_LIMIT - used),
    });

  } catch (error: unknown) {

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

  }
}
