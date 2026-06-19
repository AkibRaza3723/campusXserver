import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();

export {redisClient}