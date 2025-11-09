import express from "express";

import { verifyToken } from "../middlewares/verifyToken.js";
import { createComment, getAllComments } from "../controllers/commentController.js";
const router = express.Router();

router.get("/:postId", verifyToken, getAllComments);
router.post("/", verifyToken, createComment);

export default router;
