import { Request, Response } from "express";
import { processAIRequest } from "../services/ai.service";
import { AIRequest } from "../types";

export async function explain(
  req: Request,
  res: Response
) {
  try {

    const request = req.body as AIRequest;

    const result = await processAIRequest(request);

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