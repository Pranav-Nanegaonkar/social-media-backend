import express from "express";
import { getAllPosts, createPost, deletePost } from "../controllers/postController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getAllPosts);
router.post("/", verifyToken, createPost);
router.delete("/:postid", verifyToken, deletePost);

export default router;
