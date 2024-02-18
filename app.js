const { Telegraf } = require('telegraf');
const { Markup } = require('telegraf');
const { https } = require('https');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
require('dotenv').config();
const token_telegram = process.env.token_telegram;

var start_date = new Date();
start_date.setHours(1, 0, 0, 0);
var start_date_iso = start_date.toISOString().replace('Z', '');
var end_date = new Date();
end_date.setHours(24, 59, 59, 999);
var end_date_iso = end_date.toISOString().replace('Z', '');

console.log("la fecha es " + start_date_iso + "   y   " + end_date_iso);

var apiREE = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${start_date_iso}&end_date=${end_date_iso}&time_trunc=hour`;

const nombredb = 'datosusuario.db';
//conexion a la base de datos
const db = new sqlite3.Database(nombredb, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');
});

const bot = new Telegraf(token_telegram);

var token_solax_usuario = "";
var ns_solax_usuario = "";



bot.start((ctx) => {
    // console.log(typeof(ctx));
    ctx.reply('Bienvenido a SolaxBot! \n\nEl bot que te permite conocer el precio de la luz en tiempo real y el estado de tu instalación solar fotovoltaica. \n\nPara comenzar, escribe /help para ver los comandos disponibles.',
        Markup.keyboard([
            ['/help❓', '/pvpc💰'],
            ['/produccion ☀️', '/cuenta 🔑 '],
        ])
            .resize()
    );
});

//HELP
bot.command('help', (ctx) => {
    ctx.reply('Los comandos disponibles son: \n\n/pvpc💰: Muestra el precio de la luz en tiempo real. \n\n/produccion☀️: Muestra el estado de tu instalación solar fotovoltaica.  \n\n/cuenta: Información y borrado de cuenta.');

});

//CUENTA
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
        //ctx.deleteMessage();
        let telegramId = Number(JSON.stringify(ctx.from.id, null, 2));
        db.get("Select * from usuarios where telegramid = ?", [telegramId], (err, row) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
                return ctx.reply('Ocurrió un error al verificar el usuario.');
            } if (row) {
                if (usuarioAccion === 'info') {
                    db.get("select tokensolax, ns from usuarios where telegramid = ?", [telegramId], (err, row) => {
                        if (err) {
                            console.error('Error al ejecutar la consulta:', err);
                            return ctx.reply('Ocurrió un error al verificar el usuario.');
                        } if (row) {
                            token_solax_usuario = row.tokensolax;
                            ns_solax_usuario = row.ns;
                            ctx.reply("Tu id de usuario es: " + telegramId + "\n\nTu token de solax es: " + token_solax_usuario + "\n\nTu número de serie es: " + ns_solax_usuario);
                        }
                    });

                }

                if (usuarioAccion === 'borrar') {
                    let telegramId = ctx.from.id;
                    ctx.reply("Se borrará tu cuenta " + telegramId);
                    setTimeout(() => {
                    ctx.reply('Borrando cuenta...');
                    db.run("DELETE FROM usuarios WHERE telegramid = ?", [telegramId], (err) => {
                        if (err) {
                            console.error('Error al borrar la cuenta:', err);
                            ctx.reply('Ocurrió un error al borrar la cuenta.');
                            console.log(telegramId + " esta intentando borrar su cuenta pero ha habido un error");
                        } else {
                            ctx.reply('Se han borrado todos tus datos');
                            console.log(telegramId + " ha borrado su cuenta");
                        }
                    });
                }, 2000);
                }

            } else if (!row) {
                if (usuarioAccion === 'info' || usuarioAccion === 'borrar') {
                    ctx.reply('No estas registrado, registrate con /registro');
                }
            }
        });
    });
});



//PVPC
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
                    mensaje += `Fecha y hora:  ${dia}-${mes}-${año} ${horas} horas  \n\n Precio: ${precio_kwh}€/Kwh\n\n`;

                    index++;
                }
                ctx.reply(mensaje);
            }
            setTimeout(sendNextMessage, delay);
        });
});


//PRODUCCION
bot.command('produccion', (ctx) => {
    //vamos a comprobar si el usuario esta registrado
    let telegramId = ctx.message.from.id;
    const consulta = "SELECT * FROM usuarios WHERE telegramid = ?";
    db.get(consulta, telegramId, (err, row) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return ctx.reply('Ocurrió un error al verificar el usuario.');
        } if (row) {
            // si el usuario ya esta resgistrado entonces buscamos su token y ns
            db.get("select tokensolax, ns from usuarios where telegramid = ?", [telegramId], (err, row) => {
                if (err) {
                    console.error('Error al ejecutar la consulta:', err);
                    return ctx.reply('Ocurrió un error al verificar el usuario.');
                } if (row) {
                    var token_solax = row.tokensolax;
                    var ns_solax = row.ns;
                    //API SOLAX AKI
                    axios.get(`https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId=${token_solax}&sn=${ns_solax}`)
                        .then(response => {
                            var datos = response.data;
                            var query_exitosa = datos.success;
                            var valores = datos.result;
                            if (query_exitosa === false) {
                                ctx.reply("No se ha podido obtener la información de tu instalación. \n\nRevisa que tus datos sean correctos en /cuenta \n\nEl token tiene una validez de 6 meses, si ha caducado debes obtener uno nuevo en la web de solaxcloud.com");
                            } else if (query_exitosa === true) {
                                if (valores.powerdc1 === 0){
                                    ctx.reply("🌚");
                                } else if (valores.powerdc1 > 0){
                                    ctx.reply("🌞");
                                }
                                setTimeout(() => {
                                    ctx.reply(`🔱Datos de tu instalación🔱\n\n⚡️Generación DC: ${valores.powerdc1 + valores.powerdc2} W\n\n🔌Generación AC: ${valores.acpower} W\n\n🏠Consumo eléctrico: ${valores.feedinpower} W\n\n🔅Producción de hoy: ${valores.yieldtoday} kWh\n\n🔆Producción total: ${(valores.yieldtotal / 1000).toFixed(2)} MWh\n\n⚠️Voltaje AC: ${valores.vac1} V\n\n📈Frecuencia de red: ${valores.fac1} Hz\n\n🌡Temperatura: ${valores.temperature}ºC\n\n🕐Hora del registro: ${valores.uploadTime}`);
                                }, 600);
                            }
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }
            });
        } else {
            // Usuario no registrado
            ctx.reply('Aun no te has registrado, para hacerlo escribe /registro');
        }
    });

});

//REGISTRO
bot.command('registro', (ctx) => {
    let telegramId = ctx.message.from.id;
    db.get("Select * from usuarios where telegramid = ?", [telegramId], (err, row) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return ctx.reply('Ocurrió un error al verificar el usuario.');
        } if (row) {
            ctx.reply("ya estas registrado")
        } else if (!row) {

            ctx.reply("Te vas a registrar, aceptas que se almace tu id, token de solax y NS?", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Si', callback_data: "Si" }, { text: 'No', callback_data: "No" }]
                    ]
                }
            });
            bot.action(['Si', 'No'], (ctx) => {
                const usuarioAcepta = ctx.callbackQuery.data;
                //ctx.deleteMessage();
                if (usuarioAcepta === 'Si') {
                    ctx.reply('De acuerdo, introduce tu token de Solax \n\nhttps://telegra.ph/D%C3%B3nde-encuentro-el-token-02-15');
                    bot.on("text", (ctx) => {
                        const message = ctx.message.text;
                        if (!token_solax_usuario) {
                            token_solax_usuario = message;
                            ctx.reply('Gracias, ahora escribe tu ns:');
                        } else if (!ns_solax_usuario) {
                            ns_solax_usuario = message;
                            ctx.reply("Registrando tus datos...");
                            db.run("INSERT INTO usuarios (telegramid, tokensolax, ns) VALUES (?, ?, ?)", [ctx.from.id, token_solax_usuario, ns_solax_usuario], (err) => {
                                if (err) {
                                    console.error('Error al insertar datos', err.message);
                                } else {
                                    ctx.reply(`Gracias por registrarte. Tu token es ${token_solax_usuario} y tu número de serie es ${ns_solax_usuario} \n\nYa puedes consultar tu /produccion`);
                                }
                            });
                        }
                    });

                } else if (usuarioAcepta === 'No') {
                    ctx.reply('De acuerdo, no te has registrado.');
                }

            });
        }

    });

});


bot.launch();