import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Authenticated route — only logged-in users can upload
router.post("/", verifyToken, upload.single("image"), uploadImage);

export default router;
