import Redis from "ioredis";

const redis = new Redis("redis://localhost:6379");

const connectRedis = async () => {
    try {
        await redis.connect();
        console.log("Redis connected");
    } catch (error) {
        console.log("Error connecting to Redis:", error);
    }
}

export {redis,connectRedis};