const mysql = require('mysql2/promise');

// Configura i parametri di connessione secondo il tuo ambiente
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'csv_import'
});

async function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            barcode VARCHAR(255),
            brand VARCHAR(255),
            category VARCHAR(255),
            quantity INT,
            weight DECIMAL(10,2),
            price DECIMAL(10,2)
        )
    `;
    const conn = await pool.getConnection();
    await conn.query(sql);
    conn.release();
}

// Funzione per creare la tabella 'price'
async function createPriceTable() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS price (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50),
                price DECIMAL(10,2)
            )
        `);
    } finally {
        connection.release();
    }
}

async function insertRecord(record) {
    const sql = `INSERT INTO records (name, barcode, brand, category, quantity, weight, price) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const conn = await pool.getConnection();
    await conn.query(sql, [
        record.name,
        record.barcode,
        record.brand,
        record.category,
        parseInt(record.quantity, 10) || 0,
        parseFloat(record.weight) || 0,
        parseFloat(record.price) || 0
    ]);
    conn.release();
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

module.exports = { pool, createTable, insertRecord, createPriceTable, insertPriceRecord };
