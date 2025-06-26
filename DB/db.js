// Importa il modulo mysql2/promise per la connessione asincrona a MySQL
const mysql = require('mysql2/promise');

// Crea un pool di connessioni al database MySQL
// Modifica i parametri secondo la tua configurazione locale
const pool = mysql.createPool({
    host: 'localhost', // Indirizzo del server MySQL
    user: 'root',      // Nome utente
    password: 'root',  // Password
    database: 'csv_import' // Nome del database
});

// Funzione asincrona per creare la tabella 'price' se non esiste già
async function createPriceTable() {
    const connection = await pool.getConnection(); // Ottieni una connessione dal pool
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS price (
                name VARCHAR(50),      -- Nome del prodotto (max 50 caratteri)
                price DECIMAL(10,2)    -- Prezzo con 2 decimali
            )
        `);
    } finally {
        connection.release(); // Rilascia la connessione al pool
    }
}

// Funzione asincrona per inserire un record nella tabella 'price'
// Accetta un oggetto { name, price }
async function insertPriceRecord(record) {
    const connection = await pool.getConnection(); // Ottieni una connessione dal pool
    try {
        await connection.query(
            'INSERT INTO price (name, price) VALUES (?, ?)', // Query parametrica per sicurezza
            [record.name, record.price]
        );
    } finally {
        connection.release(); // Rilascia la connessione al pool
    }
}

// Esporta il pool e le funzioni per l'uso in altri file
module.exports = { pool, createPriceTable, insertPriceRecord };
