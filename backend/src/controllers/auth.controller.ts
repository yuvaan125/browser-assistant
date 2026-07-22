import { Request, Response } from "express";
import { getGoogleLoginUrl } from "../services/auth.service";

export async function googleLogin(
  req: Request,
  res: Response
) {
  try {

    const url = await getGoogleLoginUrl();

    return res.redirect(url);

  } catch (error) {

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

  }
}