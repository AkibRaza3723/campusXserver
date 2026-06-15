import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import connectDB from "./DB/connect.db.js";

const port = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1);
    });
