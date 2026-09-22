import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as authService from "../services/authService";
import { SignUpSchema, LoginSchema } from "../schemas/auth";
import { success } from "../utils/response";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const data = SignUpSchema.parse(req.body);
    const result = await authService.signUp(data);
    res.status(201).json(success({ ...result, message: "User created" }));
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/session", requireAuth, (req, res) => {
  res.json(success(req.user));
});

router.post("/logout", requireAuth, (_req, res) => {
  // Token validado por requireAuth. No hay nada que limpiar server-side
  // (JWT stateless) — el frontend borra el token local tras esta respuesta.
  res.json(success({ message: "Logged out" }));
});

export default router;
