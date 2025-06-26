// Importa i moduli necessari
const express = require('express');
const multer = require('multer'); // Per gestire l'upload dei file
const csv = require('csv-parser'); // Per il parsing dei file CSV
const fs = require('fs');
const path = require('path');
const { createPriceTable, insertPriceRecord } = require('./DB/db'); // Funzioni per il database

const app = express();
// Configura multer per salvare i file caricati nella cartella 'uploads/'
const upload = multer({ dest: 'uploads/' });

// Servi i file statici dalla root (index.html, style.css, ecc.)
app.use(express.static(path.join(__dirname)));

// All'avvio del server, crea la tabella 'price' se non esiste già
createPriceTable().then(() => {
    console.log('Tabella price pronta');
}).catch(err => {
    console.error('Errore nella creazione della tabella price:', err);
});

// Endpoint POST per caricare e importare un file CSV
app.post('/upload', upload.single('file'), async (req, res) => {
    const results = []; // Array per salvare i dati letti dal CSV
    const filePath = req.file.path; // Percorso del file caricato

    // Leggi il file CSV e processa i dati
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data)) // Aggiungi ogni riga del CSV all'array results
        .on('end', async () => {
            fs.unlinkSync(filePath); // Elimina il file caricato dopo la lettura
            try {
                let importedPrices = 0; // Contatore dei record importati
                let skippedRecords = 0; // Contatore dei record scartati
                let skippedDetails = []; // Dettagli dei record scartati
                // Cicla su ogni record letto dal CSV
                for (const record of results) {
                    // Verifica che il nome sia presente e non troppo lungo
                    if (
                        record.name &&
                        record.name.length <= 50
                    ) {
                        // Prova a convertire il prezzo in numero decimale
                        const priceValue = parseFloat(record.price);
                        // Se il prezzo è valido e diverso da zero, inserisci nel database
                        if (record.price && !isNaN(priceValue) && priceValue !== 0) {
                            await insertPriceRecord({ name: record.name, price: priceValue });
                            importedPrices++;
                        } else {
                            // Se il prezzo non è valido, scarta il record e salvalo nei dettagli
                            skippedRecords++;
                            skippedDetails.push({ name: record.name, price: record.price });
                            console.log('Record saltato (prezzo non valido):', record);
                        }
                    } else {
                        // Se il nome non è valido, scarta il record e salvalo nei dettagli
                        skippedRecords++;
                        skippedDetails.push({ name: record.name, price: record.price });
                        console.log('Record saltato (nome non valido):', record);
                    }
                }
                // Rispondi al client con il risultato dell'importazione
                res.json({
                    message: 'Dati importati',
                    prices: importedPrices,
                    skipped: skippedRecords,
                    skippedDetails: skippedDetails
                });
            } catch (err) {
                // Gestione errori durante il salvataggio su database
                res.status(500).json({ error: 'Errore nel salvataggio su database', details: err.message });
            }
        })
        .on('error', (err) => {
            // Gestione errori durante la lettura del CSV
            res.status(500).json({ error: 'Errore nella lettura del CSV', details: err.message });
        });
});

// Endpoint GET per restituire tutti i dati della tabella price
app.get('/prices', async (req, res) => {
    try {
        // Esegui una query per ottenere tutti i record dalla tabella price
        const [rows] = await require('./DB/db').pool.query('SELECT name, price FROM price');
        res.json(rows); // Rispondi con i dati in formato JSON
    } catch (err) {
        // Gestione errori durante la lettura dal database
        res.status(500).json({ error: 'Errore nel recupero dati', details: err.message });
    }
});

// Avvia il server sulla porta 3000
app.listen(3000, () => {
    console.log('Server avviato su http://localhost:3000');
});