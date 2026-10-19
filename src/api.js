export async function getAuthor(firstName, lastName){
    const url = "https://api.zitat-service.de/v1/authors?languages=uk";
    if(!firstName || !lastName)
        return 
    {
        success: false;
        text: "Прізвище та ім'я обов'язкові поля"
    }


    const response = await fetch (url + ",firstname="+firstName+",lastname="+lastName);

    if(!response.ok)
        return
    {
        success: false;
        text: "Автора не знайдено"
    };

    const data = await response.json();

    return{
        success: true,
        text: data["authors"][0]["authorId"]
    }

}

export async function getQuote(authorId){
    url = "https://api.zitat-service.de/v1/quote?languages=uk";
    
    if(authorId)
        url += ",authorId="+authorId;

    response = await fetch(url);

    data = await response.json();

    if(!response.ok)
        return {
        success: false,
        text: data.error.message
    }

    else
        return {
        success: true,
        text: `${data.authorName}: '${data.quote}'\nРесурс:${data.source}` 
    };
}