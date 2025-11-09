import express from "express";

import { verifyToken } from "../middlewares/verifyToken.js";
import {
  addRelationship,
  deleteRelationship,
  getRelationship,
} from "../controllers/relationshopController.js";
const router = express.Router();

router.get("/", verifyToken, getRelationship);
router.delete("/", verifyToken, deleteRelationship);
router.post("/", verifyToken, addRelationship);

export default router;
