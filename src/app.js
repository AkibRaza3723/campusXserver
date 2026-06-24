import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router as userRouter } from "./User/routes/user.route.js";
import postRouter from "./posts/routes/post.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    accessControlAllowOrigin: process.env.CORS_ORIGIN,
    accessControlAllowCredentials: true,
    accessControlAllowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static("public"));


app.use("/api/v1/user", userRouter);
app.use("/api/v1/posts", postRouter);

export { app };