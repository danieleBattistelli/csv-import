const mysql = require('mysql2/promise');

// Configura i parametri di connessione secondo il tuo ambiente
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'csv_import'
});

// Funzione per creare la tabella 'price'
async function createPriceTable() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS price (
                name VARCHAR(50),
                price DECIMAL(10,2)
            )
        `);
    } finally {
        connection.release();
    }
}

// Funzione per inserire un record nella tabella 'price'
async function insertPriceRecord(record) {
    const connection = await pool.getConnection();
    try {
        await connection.query(
            'INSERT INTO price (name, price) VALUES (?, ?)',
            [record.name, record.price]
        );
    } finally {
        connection.release();
    }
}

module.exports = { pool, createPriceTable, insertPriceRecord };
