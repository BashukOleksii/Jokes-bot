import { getRedis } from "./redis-client.js";

export const USER_STATES ={
    WAITING_AUTHOR: "waiting_author"
};

const STATE_TTL_SECONDS = 10 * 60;

function getUserKey(ctx){

    if(!ctx.chatId || !ctx.from?.id)
        throw new Error('Відсутній id розмови та користувача');

    return `jokesbot:state:${ctx.from.id}:${ctx.chatId}`;
}

export async function setUserState(ctx, state){
    const key = getUserKey(ctx);

    await getRedis().set(key,state,{EX: STATE_TTL_SECONDS});
}

export async function getUserSate(ctx){
    const key = getUserKey(ctx);

    return await getRedis().get(key);
}

export async function resetUserState(ctx){
    const key = getUserKey(ctx);

    return await getRedis().del(key);
}