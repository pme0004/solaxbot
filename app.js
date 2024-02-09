const TelegramBot = require('node-telegram-bot-api');

const https = require('https');

const token = '6916045132:AAHVuFGX7u1RcLMaApjrm-ZIcFerH07NMMk';


const bot = new TelegramBot(token, { polling: true });
const tokensolax ="20240202031443435221510";
const ns="SX9YKHKWHD";

var apiUrl = 'https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId='+ tokensolax + '&sn='+ ns+'';
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    fetch(apiUrl)
        .then(response => {
            // Verificar si la respuesta es exitosa (código de estado 200)
            if (!response.ok) {
                throw new Error('Ocurrió un error al obtener los datos');
            }
            // Convertir la respuesta a JSON y retornarla
            return response.text();
        })
        .then(data => {
            // Manipular los datos obtenidos
            console.log(data); // Mostrar los datos en la consola
            // Aquí puedes almacenar los datos en una variable para manipularlos posteriormente
           
            // Por ejemplo:
            const carai=data;
            bot.sendMessage(chatId, carai);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: {
            keyboard: [['PVPC💵', '⚙️', '❓']],
            resize_keyboard: true,
        }
    };

    bot.sendMessage(chatId, 'Elige una función', opts);
});