import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  addLike,
  deleteLike,
  getLikes,
} from "../controllers/likeController.js";
const router = express.Router();

router.get("/", verifyToken, getLikes);
router.delete("/", verifyToken, deleteLike);
router.post("/", verifyToken, addLike);

export default router;
