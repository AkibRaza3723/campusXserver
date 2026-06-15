

class ApiError extends Error {
    constructor(statusCode , message , error = [] , stack = ""){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.stack = stack;
    }
}

export {ApiError}