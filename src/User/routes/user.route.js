import { Router } from "express";
import { requestOtp, verifyOtp } from "../Controllers/user.controller.js";

const router = Router();

router.route("/request-otp").post(requestOtp);
router.route("/verify-otp").post(verifyOtp);

export { router }