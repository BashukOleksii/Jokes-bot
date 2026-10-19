import { Bot } from "node-telegram-bot-api";
import { getQuote, getAuthor, getPhoto } from "./api.js";
import { subscribe, unsubscribe, isActive } from "./subscription-service.js";
import { USER_STATES,getUserSate, setUserState, resetUserState } from "./state-service.js";

export const bot = new Bot(process.env.BOT_TOKEN);

async function getReplyKeyboard(chatId){
    return {
        keyboard:[
            [
                {text: "Цитата"},
                {text: "Жарт"}
            ],
            [
                {text: (await isActive(chatId)) ? "Відписатись":"Підписатись"}
            ]
                    ],
            resize_keyboard: true,
            is_persistent: true,
    }
             
}

bot.command('start', async (ctx) =>{ 
    await resetUserState(ctx);

     await ctx.reply(
            `Привіт, ${ctx.from?.first_name ?? 'друже'}, обирай дію!`,
            {
                reply_markup:  await getReplyKeyboard(ctx.chatId)
            }
        );
})

bot.hears('Цитата', async (ctx)=>{
    await resetUserState(ctx);
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
    await resetUserState(ctx);

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
        await ctx.reply("Успішно! Оформлено щоденну підписку о 9 годині за Києвом",
            { reply_markup: await getReplyKeyboard(ctx.chatId)} );
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
        await ctx.reply('Успішно! Підписку скасовано', {reply_markup: await getReplyKeyboard(ctx.chatId)})
    }
    catch{
        await ctx.reply('Помилка скасування підписки');
    }
})

bot.on("callback_query", async (ctx) =>{
    const data = ctx.callbackQuery?.data;
    await ctx.answerCallbackQuery();

    let answer;

    if(data === 'random_quote'){
        try{
            await resetUserState(ctx);
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
        await ctx.reply(
            "Введіть ім'я та прізвище автора розділених комою",
            {
                reply_markup: {
                    keyboard: [[{ text: 'Скасувати'}]],
                    resize_keyboard: true,
                    is_persistent: true
                },
            }
        )
        
        await setUserState(ctx, USER_STATES.WAITING_AUTHOR);
    }
});

bot.hears('Скасувати', async (ctx) =>{
    await resetUserState(ctx);
    await ctx.reply("Дію скасовано", {reply_markup: await getReplyKeyboard(ctx.chatId)})
})

bot.on('message', async (ctx) =>{
    const state = await getUserSate(ctx);

    if(state === USER_STATES.WAITING_AUTHOR){
        const text = ctx.message?.text?.trim();

        if(!text){
            await ctx.reply("Введіть ім'я автора текстом");
            return;
        }

        if(text.startsWith('/'))
            return;

        const authorData = text.split(',');

        if(authorData.length !== 2){
            await ctx.reply("Потрібно ввести два слова");
            return;
        }

        try{

            const authorIdData = await getAuthor(authorData[0].trim(),authorData[1].trim());

            if(!authorIdData.success){
                await ctx.reply(authorIdData.text);
                return;
            }

            const quote = await getQuote(authorIdData.text);

            resetUserState(ctx);

            await ctx.reply(quote.text, {reply_markup: await getReplyKeyboard(ctx.chatId)});

        }
        catch(err){
            await ctx.reply(`Помилка: ${err.message}`);
        }
        
    }
})
