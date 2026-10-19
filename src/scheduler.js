import cron from "node-cron"
import { bot } from "./bot.js";
import { getQuote, getPhoto } from "./api.js";
import { markAsSent, getSubscribers } from "./subscription-service.js";

function getKiyvDate(){
    return new Intl.DateTimeFormat('en-CA',{
        timeZone: "Europe/Kyiv",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

export async function sendDailyContent() {
    const today = getKiyvDate();

    const subscribers = getSubscribers();

    for await(const subscriber of subscribers){

        if(subscriber.lastSentDate === today)
            continue;

        try{

            const quoteData = await getQuote();

            if(!quoteData.success)
                throw new Error(quoteData.text);

            const memeData = await getPhoto();

            if(!memeData.success)
                throw new Error(memeData.text);

            await bot.api.sendMessage({
                chat_id: subscriber.chatId,
                text: `Цитата дня:\n${quoteData.text}`
            });

            await bot.api.sendPhoto({
                chat_id: subscriber.chatId,
                photo: memeData.imageUrl,
                caption: `Мем дня:\n${memeData.title}`
            })

            await markAsSent(subscriber.chatId,today);

            console.log(`Надіслано повідомлення для ${subscriber.chatId}`);
        }
        catch(err){
            console.log(`Помилка для ${subscriber.chatId}`, err)
        }
    }
}


export function startSchedule(){
    cron.schedule(
        '0 9 * * *',
        sendDailyContent,
        {
            timezone: "Europe/Kyiv",
            noOverlap: true
        }
    )

     console.log("Планувальник запущено щодня о 9:00")
}
