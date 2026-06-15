
const asyncHandler = (func) => {
    return async (req , res , next) => {
        try {
            await func(req , res , next);
        } catch (error) {
            console.log(error);
            res.status(error.statusCode || 500).json({ message: "Internal Server Error" });
        }
    }
}
    