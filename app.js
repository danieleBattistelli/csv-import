const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { createPriceTable, insertPriceRecord } = require('./DB/db');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Servi i file statici dalla root (index.html, style.css, ecc.)
app.use(express.static(path.join(__dirname)));

// Crea la tabella 'price' all'avvio del server
createPriceTable().then(() => {
    console.log('Tabella price pronta');
}).catch(err => {
    console.error('Errore nella creazione della tabella price:', err);
});

//Chiamata POST
app.post('/upload', upload.single('file'), async (req, res) => {
    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            fs.unlinkSync(filePath);
            try {
                let importedPrices = 0;
                for (const record of results) {
                    if (
                        record.name &&
                        record.name.length <= 50
                    ) {
                        const priceValue = parseFloat(record.price);
                        if (record.price && !isNaN(priceValue) && priceValue !== 0) {
                            await insertPriceRecord({ name: record.name, price: priceValue });
                            importedPrices++;
                        }
                        // Se il prezzo non è valido, non salvare nulla
                    }
                }
                res.json({
                    message: 'Dati importati',
                    prices: importedPrices
                });
            } catch (err) {
                res.status(500).json({ error: 'Errore nel salvataggio su database', details: err.message });
            }
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Errore nella lettura del CSV', details: err.message });
        });
});

// Endpoint per restituire tutti i dati della tabella price
app.get('/prices', async (req, res) => {
    try {
        const [rows] = await require('./DB/db').pool.query('SELECT name, price FROM price');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dati', details: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server avviato su http://localhost:3000');
});