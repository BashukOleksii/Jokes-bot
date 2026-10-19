export async function getAuthor(firstName, lastName){
    const url = "https://api.zitat-service.de/v1/authors?language=uk";
    if(!firstName || !lastName)
        return{
        success: false,
        text: "Прізвище та ім'я обов'язкові поля"
    }


    const response = await fetch (url + "&firstname="+encodeURIComponent(firstName)+"&lastname="+encodeURIComponent(lastName));

    if(!response.ok)
        return{
        success: false,
        text: "Автора не знайдено"
    };

    const data = await response.json();

    return{
        success: true,
        text: data["authors"][0]["authorId"]
    }

}

export async function getQuote(authorId){
    let url = "https://api.zitat-service.de/v1/quote?language=uk";
    
    if(authorId)
        url += "&authorId="+authorId;

    const response = await fetch(url);

    const data = await response.json();

    if(!response.ok)
        return {
        success: false,
        text: data.error.message
    }

    else
        return {
        success: true,
        text: `${data.authorName}: '${data.quote}'\nРесурс: ${data.source}` 
    };
}

export async function getPhoto(){
    const url = "https://meme-api.com/gimme";

    for(let i = 0; i < 20; i++){
        const response = await fetch(url);

        if(!response.ok)
            throw new Error(`Meme API error status: ${response.status}`);
        
        const data = await response.json();

        if(data.nsfw || data.spoiler)
            continue;
        
        if(!/^https:\/\/i/.test(data.url ?? "") ||
            !/\.(jpg|png|jpeg)(?:\?|$)/i.test(data.url ?? "")
        )
            continue;

        return {
            success: true,
            title: data.title ?? "Випадковий мем",
            imageUrl: data.url,
            pageUrl: data.postLink
        };
    }

    return {
        success: false,
        text: "Не вдалось знайти фото"
    }
}