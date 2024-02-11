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

db.close((err) => {
    if (err) {
        console.error('Error al cerrar la base de datos', err.message);
    } else {
        console.log('Conexión a la base de datos cerrada exitosamente');
    }
 });