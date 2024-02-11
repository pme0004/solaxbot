const { Telegraf } = require('telegraf');
const { Markup } = require('telegraf');
const { https } = require('https');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { token, tokensolax, ns } = require('./config.js');
module.exports = { token, tokensolax, ns };

var start_date = new Date();
start_date.setHours(1 , 0, 0, 0);
var start_date_iso=start_date.toISOString();
var end_date = new Date();
end_date.setHours(24, 59, 59, 999);
var end_date_iso= end_date.toISOString(0);
console.log("la fecha es "+ start_date_iso + "   y   "+end_date_iso);
var apiSolax = `https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId=${tokensolax}&sn=${ns}`;
var apiREE = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${start_date_iso}&end_date=${end_date_iso}&time_trunc=hour`;
console.log(apiREE);

console.log(token);

const nombredb = 'datosusuario.db';


const db = new sqlite3.Database(nombredb, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');
});

const bot = new Telegraf(token);

bot.start((ctx) => {
    // console.log(ctx);
    ctx.reply('Bienvenido a SolaxBot! \n\nEl bot que te permite conocer el precio de la luz en tiempo real y el estado de tu instalación solar fotovoltaica. \n\nPara comenzar, escribe /help para ver los comandos disponibles.');
});

bot.command('help', (ctx) => {
    ctx.reply('Los comandos disponibles son: \n\n/pvpc: Muestra el precio de la luz en tiempo real. \n\n/produccion: Muestra el estado de tu instalación solar fotovoltaica.');
    let userid = ctx.from.id;
    console.log(userid);

    // console.log(telegramId);
});

bot.command('pvpc', (ctx) => {
    axios.get(apiREE)
    .then(response => {
        var luz = response.data;
        console.log(luz);
        ctx.reply(JSON.stringify(luz, null, 2)); //convirte el objeto a string
    })
});

bot.command('produccion', (ctx) => {
    //vamos a comprobar si el usuario esta registrado
    let telegramId = ctx.message.from.id;
    const consulta = "SELECT * FROM usuarios WHERE telegramid = ?";
    db.get(consulta, telegramId, (err, row) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return ctx.reply('Ocurrió un error al verificar el usuario.');
        } if (row) {
            // usuario ya resgistrado
            //ctx.reply('¡El usuario está registrado en la base de datos!');
            //API SOLAX AKI
            axios.get(apiSolax)
                .then(response => {
                    var datos = response.data;
                    console.log(datos);
                    ctx.reply(JSON.stringify(datos, null, 2)); //convirte el objeto a string
                })
                .catch(error => {
                    console.error(error);
                });
                
        } else {
            // Usuario no registrado
            ctx.reply('Aun no te has registrado, para hacerlo escribe /registro');
        }
    });

});

bot.command('registro', (ctx) => {
    ctx.reply("Te vas a registrar, aceptas que se almace tu id, token de solax y NS?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Si', callback_data: "Si" }, { text: 'No', callback_data: "No" }]
            ]
        }
    });

});
bot.action(['Si', 'No'], (ctx) => {
    const usuarioAcepta = ctx.callbackQuery.data;
    ctx.deleteMessage();

    if (usuarioAcepta === 'Si') {
        ctx.reply('De acuerdo, introduce tu token de Solax');
        // Variable para controlar si se debe escuchar el siguiente mensaje
        let escucharSiguienteMensaje = true;

        // Manejador de evento para el token de Solax
        bot.on("text", (ctx) => {
            if (escucharSiguienteMensaje) {
                const tokenuser = ctx.message.text;
                const telegramId = ctx.message.from.id;
                ctx.reply("Ahora introduce tu numero de serie");
                escucharSiguienteMensaje = false;

                // Manejador de evento para el número de serie
                bot.on("text", (ctx) => {
                    const ns = ctx.message.text;
                    console.log(tokenuser, ns, telegramId);
                    ctx.reply(`Gracias por registrarte. Tu token es ${tokenuser} y tu número de serie es ${ns}`);
                });
            }
        });
    } else {
        ctx.reply('De acuerdo, no te has registrado');
    }

});

bot.launch();
