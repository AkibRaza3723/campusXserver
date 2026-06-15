import { createClient } from 'redis';
// Connect to local Redis (or your cloud Redis URL)

const redisClient = createClient();
 
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
   await redisClient.connect();


export default redisClient;