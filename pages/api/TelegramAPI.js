import axios from 'axios';

export default async (req, res) => {
    res.status(200).json(await callTelegramAPI(req.query.msg))
}

/**
 * 텔레그램 봇
 * 
 * @param {}} type 
 * @returns 
 */
const callTelegramAPI = async (msg) => {
    let API_URL     = "https://api.telegram.org/bot" 
                    + process.env.TELEGRAM_TOKEN 
                    + "/sendMessage?chat_id=" + process.env.TELEGRAM_CHAT_ID 
                    + "&text=" + encodeURI(msg);

    await axios({url:API_URL, method:"GET"}).catch(error => {
        console.log(error);
    });

    return {};
}
