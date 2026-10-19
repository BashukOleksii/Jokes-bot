import { Bot } from "node-telegram-bot-api";
import { getQuote, getAuthor, getPhoto } from "./api.js";
import { subscribe, unsubscribe } from "./subscription-service.js";

export const bot = new Bot(process.env.BOT_TOKEN);

const userStates = new Map();

const userStatesArray = [
    'waiting_author']

function getUserKey(ctx){
    if(ctx.chatId == null || ctx.from?.id == null){
        return null;
    }

    else return `${ctx.chatId}:${ctx.from.id}`;
}


function resetState(ctx){
    const key = getUserKey(ctx);

    if(key)
        userStates.delete(key);
}

bot.command('start', async (ctx) =>{ 
    resetState(ctx);

    await ctx.reply(
        `Привіт, ${ctx.from?.first_name ?? 'друже'}, обирай дію!`,
        {
            reply_markup:{
                keyboard:[
                    [
                        {text: "Цитата"},
                        {text: "Жарт"}
                    ],
                    [
                        {text: "Підписатись"}
                    ]
                ],
                resize_keyboard: true,
                is_persistent: true,
            }
        }
    );
})

bot.command('cancel', async (ctx) =>{
    resetState(ctx);
    await ctx.reply("Дію скасовано");
})

bot.hears('Цитата', async (ctx)=>{
    resetState(ctx);
    await ctx.reply(
    "Ви бажаєте цитату конкретного автора чи рандомну цитату?",
    {
        reply_markup:{
            inline_keyboard:[
                [
                    {
                        text: "Рандомна цитата",
                        callback_data: "random_quote"
                    },
                    {
                        text: "Цитата конкретного автора",
                        callback_data: "author_quote"
                    }
                ]
            ]
        }
    }
)}
)

bot.hears('Жарт', async (ctx)=>{
    resetState(ctx);

    const memeData = await getPhoto();

    if(!memeData.success){
        await ctx.reply(memeData.text);
        return;
    }

    await ctx.api.sendPhoto({
        chat_id: ctx.chatId,
        photo: memeData.imageUrl,
        caption: memeData.title
    });

})

bot.hears('Підписатись', async (ctx) =>{
    try{
        if(ctx.chat?.type != 'private'){
            await ctx.reply('Підписка присутня лише в приватній розмові');
            return;
        }

        await subscribe(ctx.chatId, ctx.from.id);
        await ctx.reply("Успішно! Оформлено щоденну підписку о 9 годині за Києвом");
    }
    catch{
        await ctx.reply('Помилка із збереженням підписки')
    }
})

bot.hears('Відписатись',async (ctx)=> {
    try{
        if(ctx.chat?.type != 'private'){
            await ctx.reply('Підписка присутня лише в приватній розмові');
            return;
        }

        await unsubscribe(ctx.chatId);
        await ctx.reply('Успішно! Підписку скасовано')
    }
    catch{
        await ctx.reply('Помилка скасування підписки');
    }
})

bot.on("callback_query", async (ctx) =>{
    const data = ctx.callbackQuery?.data;
    await ctx.answerCallbackQuery();

    const key = getUserKey(ctx);

    if(!key)
        return;

    let answer;

    if(data === 'random_quote'){
        try{
            resetState(ctx);
            answer = await getQuote();
            if(!answer.success)
                await ctx.reply(`Помилка: ${answer.text}`)
            else
                await ctx.reply(answer.text);
        }
        catch(err){
            await ctx.reply(`Помилка: ${err.message}`);
        }
    }
    else if(data === 'author_quote'){
        await ctx.reply("Введіть ім'я та прізвище автора через пробіл\nДля скасування введіть '/cancel'");
        userStates.set(key,userStatesArray[0])
    }
});

bot.on('message', async (ctx) =>{
    const key = getUserKey(ctx);

    if(!key)
        return;

    const state = userStates.get(key);

    if(state === userStatesArray[0]){
        const text = ctx.message?.text?.trim();

        if(!text){
            await ctx.reply("Введіть ім'я автора текстом");
            return;
        }

        if(text.startsWith('/'))
            return;

        const authorData = text.split(/\s+/);

        if(authorData.length !== 2){
            await ctx.reply("Потрібно ввести два слова");
            return;
        }


        try{

            const authorIdData = await getAuthor(authorData[0],authorData[1]);

            if(!authorIdData.success){
                await ctx.reply(authorIdData.text);
                return;
            }

            const quote = await getQuote(authorIdData.text);

            userStates.delete(key);

            await ctx.reply(quote.text);

        }
        catch(err){
            await ctx.reply(`Помилка: ${err.message}`);
        }
        
    }
})
