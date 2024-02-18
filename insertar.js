const sqlite3 = require('sqlite3').verbose();

// Especifica el nombre de la base de datos
const nombredb = 'datosusuario.db';

// Crea una nueva instancia de la base de datos
const db = new sqlite3.Database(nombredb, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log(`Base de datos '${nombredb}' creada exitosamente`);
    }
});
var telegramid = 6355233624;
var tokensolax = "esto es un token de prueba";
var ns = "esto es un numero de serie de prueba";

function insertarusuario(telegramid, tokensolax, ns){
    db.run("INSERT INTO usuarios (telegramid, tokensolax, ns) VALUES (?, ?, ?)", [telegramid, tokensolax, ns], (err) => {
        if (err) {
            console.error('Error al insertar datos', err.message);
        } else {
            console.log('Datos insertados exitosamente');
        }
    });
}

insertarusuario(telegramid, tokensolax, ns);

db.close((err) => {
    if (err) {
        console.error('Error al cerrar la base de datos', err.message);
    } else {
        console.log('Conexión a la base de datos cerrada exitosamente');
    }
 });