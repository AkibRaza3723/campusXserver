import { Router } from "express";
import { createPost, deletePost } from "../controllers/post.controller.js";
import { varifyJWT } from "../../Middleware/jwt.auth.middleware.js";
import { upload } from "../../Middleware/multer.middleware.js";

const router = Router();

router.use(varifyJWT);

router.route("/create").post(
    upload.array("media", 5), // allow up to 5 images/videos per post
    createPost
);

router.route("/delete/:postId").delete(deletePost);

export default router;
