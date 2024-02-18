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


function creartabla(){
    db.run("CREATE TABLE IF NOT EXISTS usuarios (id integer primary key autoincrement, telegramid integer, tokensolax text, ns text)"
    , (err) => {
        if (err) {
            console.error('Error al crear la tabla', err.message);
        } else {
            console.log('Tabla "usuarios" creada exitosamente');
        }
    });
}

creartabla();
/*
var tokensolax = "20230422192945984288033";
var ns = "SX9YKHKWHD";
insertarusuario(telegramId, tokensolax, ns);

function insertarusuario(telegramid, tokensolax, ns){
    db.run("INSERT INTO usuarios (telegramid, tokensolax, ns) VALUES (?, ?, ?)", [telegramid, tokensolax, ns], (err) => {
        if (err) {
            console.error('Error al insertar datos', err.message);
        } else {
            console.log('Datos insertados exitosamente');
        }
    });
    
}

var telegramId = 5153846609;

borrarfila(telegramId);
function borrarfila(telegramId){
    db.run("DELETE FROM usuarios WHERE telegramid = ?", [telegramId], (err) => {
        if (err) {
            console.error('Error al borrar la cuenta:', err);
        } else {
            console.log('Se han borrado los datos');
        }
    });
}
*/

db.close((err) => {
    if (err) {
        console.error('Error al cerrar la base de datos', err.message);
    } else {
        console.log('Conexión a la base de datos cerrada exitosamente');
    }
 });