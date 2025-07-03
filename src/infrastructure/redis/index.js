import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
const redisClient = createClient({
 url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));

await redisClient.connect();

export default redisClient;
