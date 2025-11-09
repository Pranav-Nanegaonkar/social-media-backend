import express from "express";
import {
  checkAuth,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, checkAuth);

export default router;
