import asyncHandler from "../../Utils/asyncHandler.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../../Utils/resError.js";
import { ApiRes } from "../../Utils/response.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../Utils/cloudinary.js";

const createPost = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    // Ensure we always have an array of files. (by multer in req.files)
    const files = Array.isArray(req.files) ? req.files : req.files?.media || [];

    if (!title && !content && (!files || files.length === 0)) {
        throw new ApiError(400, "Please provide title, content or media files");
    }

    const mediaUrls = [];

    // If user uploaded files, process them with Cloudinary
    if (files && files.length > 0) {
        for (const file of files) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path);

            if (cloudinaryResponse) {
                mediaUrls.push({
                    url: cloudinaryResponse.url,
                    mediaType: cloudinaryResponse.resource_type // "image" or "video"
                });
            }
        }
    }

    const post = await Post.create({
        title,
        content,
        media: mediaUrls,
        author: req.user._id
    });

    return res.status(201).json(new ApiRes(201, post, "Post created successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params; //Url parameters - industry standard for delete or update

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }

    if (post.media && post.media.length > 0) {
        for (const media of post.media) {
            // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v1234567/public_id.jpg
            // .pop() gets the last segment (public_id.jpg), and .split(".")[0] removes the extension.
            const publicId = media.url.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, media.mediaType);
        }
    }

    // Delete the post from the database
    await post.deleteOne();

    return res.status(200).json(new ApiRes(200, {}, "Post deleted successfully"));
});

export { createPost, deletePost };
