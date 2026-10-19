import { MongoClient } from "mongodb"; 

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connectDB(){
    await client.connect();

    db = client.db(process.env.MONGODB_NAME);

    await db.collection("subscriptions").createIndex(
        {chatId: 1},
        {unique: true}
    )
}

export function getDB(){
    if(!db)
        throw new Error("Connection is not setted");

    return db;
}

export function closeDB(){
    await client.console();
}