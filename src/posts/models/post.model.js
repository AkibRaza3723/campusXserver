import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true,
        default: ""
    },
    media: [
        {
            url: {
                type: String,
                required: true
            },
            mediaType: {
                type: String,
                enum: ["image", "video"],
                required: true
            }
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }//to avoid varification check through user before every post (copy it from user model)
}, {timestamps: true});

export const Post = mongoose.model("Post", postSchema);
