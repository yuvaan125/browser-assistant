import { Request, Response } from "express";
import { processAIRequest } from "../services/ai.service";
import { getOrCreateUser } from "../services/user.service";
import { recordUsage } from "../services/usage.service";
import { AIRequest } from "../types";

interface AuthedUser {
  id: string;
  email?: string;
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
