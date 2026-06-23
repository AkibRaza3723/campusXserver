import { Router } from "express";
import { logOut, regenerateAccessToken, requestOtp, verifyOtp } from "../Controllers/user.controller.js";
import { varifyJWT } from "../../Middleware/jwt.auth.middleware.js"

const router = Router();

router.route("/request-otp").post(requestOtp);
router.route("/verify-otp").post(verifyOtp);
router.route("/logout").post(varifyJWT, logOut);
router.route("/regenerate-token").post(regenerateAccessToken);

export { router }