import { Request, Response } from "express";

export async function explain(
  req: Request,
  res: Response
) {
  res.json({
    success: true,
    message: "AI controller working",
  });
}