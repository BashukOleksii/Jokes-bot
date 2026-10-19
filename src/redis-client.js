import { createClient } from "redis";

let redisClient = null;

export async function connectRedis() {
    if(!process.env.REDIS_URL)
        throw new Error("REDIS_URL не встановлено");

    if(!redisClient)
        redisClient = createClient({url: process.env.REDIS_URL});

    if(!redisClient.isOpen)
        await redisClient.connect();

    console.log('Redis підключено');
}

export function getRedis(){
    if(!redisClient)
        throw new Error('Клієнт для Redis ще не готовий');

    return redisClient;
}