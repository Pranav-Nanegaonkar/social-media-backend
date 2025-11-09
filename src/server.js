import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import likeRouter from "./routes/likeRoutes.js";
import relationshipRouter from "./routes/relationshipRoutes.js";
import authRouter from "./routes/authRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./utils/globalErrorHandler.js";
dotenv.config();
const app = express();

//? middlewares
app.use(express.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/api/upload", uploadRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/comment", commentRouter);
app.use("/api/like", likeRouter);
app.use("/api/relationship", relationshipRouter);
app.use("/api/auth", authRouter);

app.use(globalErrorHandler);

export default app;
