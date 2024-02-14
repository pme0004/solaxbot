const { Telegraf } = require('telegraf');
const { Markup } = require('telegraf');
const { https } = require('https');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { token, token_solax, ns_solax } = require('./config.js');
const { type } = require('os');
module.exports = { token, token_solax, ns_solax };

var start_date = new Date();
start_date.setHours(1, 0, 0, 0);
var start_date_iso = start_date.toISOString().replace('Z', '');
var end_date = new Date();
end_date.setHours(24, 59, 59, 999);
var end_date_iso = end_date.toISOString().replace('Z', '');

console.log("la fecha es " + start_date_iso + "   y   " + end_date_iso);

var apiSolax = `https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId=${token_solax}&sn=${ns_solax}`;
var apiREE = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${start_date_iso}&end_date=${end_date_iso}&time_trunc=hour`;
console.log(apiREE);
const nombredb = 'datosusuario.db';

//conexion a la base de datos
const db = new sqlite3.Database(nombredb, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');
});

const bot = new Telegraf(token);

bot.start((ctx) => {
    // console.log(typeof(ctx));
    ctx.reply('Bienvenido a SolaxBot! \n\nEl bot que te permite conocer el precio de la luz en tiempo real y el estado de tu instalación solar fotovoltaica. \n\nPara comenzar, escribe /help para ver los comandos disponibles.',
        Markup.keyboard([
            ['/help❓', '/pvpc💰'],
            ['/produccion ☀️', '/registro 🔑 '],
        ])
            .resize()
    );
});

bot.command('help', (ctx) => {
    ctx.reply('Los comandos disponibles son: \n\n/pvpc💰: Muestra el precio de la luz en tiempo real. \n\n/produccion☀️: Muestra el estado de tu instalación solar fotovoltaica.  \n\n/cuenta: Información y borrado de cuenta.');
    let userid = ctx.from.id;
});

bot.command('cuenta', (ctx) => {
    ctx.reply("¿Qué  gestión quieres hacer?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Información', callback_data: "info" }, { text: 'Borrar cuenta', callback_data: "borrar" }]
            ]
        }
    });


    bot.action(['info', 'borrar'], (ctx) => {
        const usuarioAccion = ctx.callbackQuery.data;
        //se comprueba si el usuario esta registrado
        let idtelegram = Number(JSON.stringify(ctx.from.id, null, 2));
        db.get("Select * from usuarios where telegramid = ?", [idtelegram], (err, row) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
                return ctx.reply('Ocurrió un error al verificar el usuario.');
            } if (row) {
                let usuarioregistrado = true;
            } else {
                let usuarioregistrado = false;
            }
        });
        //logica si el usuario quiere ver info
        if (usuarioAccion === 'info') {
            ctx.reply('Se mostrará la información de la cuenta' + usuarioregistrado);
            ctx.reply("Tu id de usuario es: " + idtelegram + "\n\nTu token de solax es: " + token_solax + "\n\nTu número de serie es: " + ns_solax);

        } else {
            // Usuario no registrado
            ctx.reply('No te has registrado, por lo que no hemos almacenado información tuya. Para hacerlo escribe /registro');
        }
    });

    //logica si el usuario desea borrar
    if (usuarioAccion === 'borrar') {
        let idtelegram = Number(JSON.stringify(ctx.from.id, null, 2));
        //se comprueba si el usuario esta registrado
        db.get("select * FROM usuarios WHERE telegramid = ?", [idtelegram], (err, row) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
            } if (row) {//si esta registrado, se le ofrece borrar la cuenta
                ctx.replyWithMarkdownV2("Se borrará tu cuenta " + idtelegram + "\n\nEscribe *__Quiero borrar mi cuenta__* para confirmar");
                bot.hears('Quiero borrar mi cuenta', (ctx) => {//si escribe tal y como se pide que borre la cuenta se procede
                    ctx.reply('Borrando cuenta...');
                    db.run("DELETE FROM usuarios WHERE telegramid = ?", [idtelegram], (err) => {
                        if (err) {
                            console.error('Error al borrar la cuenta:', err);
                            return ctx.reply('Ocurrió un error al borrar la cuenta.');
                        } else {
                            ctx.reply('Se han borrado toddos tus datos');
                        }
                    });
                });
            } else if (!row) {
                ctx.reply('Aún no te has registrado, si quieres registarte escribe /registro');
            }
        });

    }
});



bot.command('pvpc', (ctx) => {
    axios.get(apiREE)
        .then(response => {
            var luzjson = response.data;
            var preciospvpc = luzjson.included.find(item => item.type === "PVPC (€/MWh)").attributes.values;
            var index = 0;
            var delay = 1000; // Tiempo de retraso entre cada envío de mensaje (en milisegundos)

            function sendNextMessage() {
                let mensaje = '';
                if (index < preciospvpc.length) {
                    let precio = preciospvpc[index];
                    let precio_kwh = (precio.value / 1000).toFixed(3);
                    var fecha = new Date(precio.datetime);
                    var año = fecha.getFullYear();
                    var mes = fecha.getMonth() + 1;
                    var dia = fecha.getDate();
                    var horas = fecha.getHours();

                    //ctx.reply(`Fecha y hora:  ${dia}-${mes}-${año} ${horas} horas  \n\n Precio: ${precio_kwh}€/Kwh`);
                    mensaje += `Fecha y hora:  ${dia}-${mes}-${año} ${horas} horas  \n\n Precio: ${precio_kwh}€/Kwh\n\n`;

                    index++;
                }
                ctx.reply(mensaje);
            }

            setTimeout(sendNextMessage, delay);
        });
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
});



bot.launch();
