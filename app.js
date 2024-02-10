const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('datosusuario.db', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

const token = '6916045132:AAHVuFGX7u1RcLMaApjrm-ZIcFerH07NMMk';
var date= new Date();
console.log(date);
const tokensolax ="20240202031443435221510";
const ns="SX9YKHKWHD";
var apiUrl = 'https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId='+ tokensolax + '&sn='+ ns+'';

const bot = new TelegramBot(token, { polling: true });

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