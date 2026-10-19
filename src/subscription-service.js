import { getDB } from "./database.js";

function subscriptions(){
    return getDB().collection('subscriptions');
}

export async function subscribe(chatId, userId){
    const now = new Date();

    await subscriptions().updateOne(
        {chatId: chatId},
        {
            $set:{
                userId: userId,
                active: true,
                updatedAt: now
            },
            $setOnInsert:{
                createdAt: now,
                lastSentDate: null
            }
        },
        {upsert: true}
    )
}

export async function unsubscribe(chatId){
    const result = await subscriptions().updateOne(
        {chatId: chatId},
        {
            $set: {
                active: false,
                updatedAt: new Date()
            }
        }
    );

    return result.matchedCount > 0;
}

export function getSubscribers() {
    return subscriptions().find({
        active: true
    });
}

export async function markAsSent(chatId, date) {
    await subscriptions().updateOne(
        {chatId: chatId},
        { $set: {
                lastSentDate: date
            }
        }
    );
}

export async function isActive(chatId) {
    const subscriber =  await subscriptions().findOne({chatId: chatId});

    return subscribe?.active === true;
}