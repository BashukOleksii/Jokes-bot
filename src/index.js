import "dotenv/config";
import { bot } from "./bot.js";
import { createWebhookServer } from "node-telegram-bot-api/node";
import { getAuthor, getQuote} from "./api.js"

const TOKEN = process.env.BOT_TOKEN;
const SECRET = process.env.WEBHOOK_SECRET;
const PORT = Number(process.env.PORT || 3000);

const WEBHOOK_PATH = '/telegram';

const PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

if(!TOKEN || !SECRET){
    throw new Error("Токен чи секрет не встановлено");
}


const server = createWebhookServer(bot, {
    path: WEBHOOK_PATH,
    secretToken: SECRET
});

server.listen(PORT, "0.0.0.0", async() =>{
    console.log("Сервер запущено");

    if(!PUBLIC_DOMAIN){
        console.log("Публічного логіну не згенеровано!");
        return;
    }

    const webhookUrl = `https://${PUBLIC_DOMAIN}${WEBHOOK_PATH}`;

    try{
        await bot.api.setWebhook({
            url: webhookUrl,
            secret_token: SECRET,
            allowed_updates: ['message']
        }); й

        console.log("webhook вставновлено")

        const info = await bot.api.getWebhookInfo()

        console.log("Очікувана URL: " + info.url);
    }
    catch{
        console.log("Помилка реєстрації webhook");
    }
})