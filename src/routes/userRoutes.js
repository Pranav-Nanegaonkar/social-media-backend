import express from "express";
import { getUser, updateUser } from "../controllers/userController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express.Router();

router.put("/update",verifyToken, updateUser);
router.get("/find/:userid",verifyToken, getUser);

export default router;
