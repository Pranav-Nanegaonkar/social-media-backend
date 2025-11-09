import express from "express";
import { getAllPosts, createPost } from "../controllers/postController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getAllPosts);
router.post("/", verifyToken, createPost);

export default router;
