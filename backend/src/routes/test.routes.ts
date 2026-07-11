import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

router.get("/", async (req, res) => {

  const { data, error } =
    await supabase.auth.admin.listUsers();

  if (error) {
    return res.status(500).json(error);
  }

  return res.json({
    success: true,
    users: data.users.length
  });

});

export default router;