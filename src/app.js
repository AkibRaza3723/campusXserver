import express, { Router } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const router = Router();
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



app.use("/api/v1/user", router);




export { app,router };