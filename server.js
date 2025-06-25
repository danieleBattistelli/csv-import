const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { createTable, insertRecord } = require('./DB/db');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Crea la tabella all'avvio del server
createTable().then(() => {
    console.log('Tabella MySQL pronta');
}).catch(err => {
    console.error('Errore nella creazione della tabella:', err);
});

app.post('/upload', upload.single('file'), async (req, res) => {
    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            fs.unlinkSync(filePath);
            try {
                console.log('Record letti dal CSV:', results); // DEBUG: mostra i dati letti
                for (const record of results) {
                    console.log('Inserisco record:', record); // DEBUG: mostra il record che si sta inserendo
                    // Controllo lunghezza campo 'name'
                    if (record.name && record.name.length > 50) { // supponendo VARCHAR(50)
                        console.warn(`Record saltato: campo 'name' troppo lungo (${record.name.length} caratteri):`, record.name);
                        continue; // salta il record troppo lungo
                    }
                    await insertRecord(record);
                }
                res.json({ message: 'Dati importati e salvati nel database MySQL', count: results.length });
            } catch (err) {
                console.error('Errore dettagliato nel salvataggio su database MySQL:', err); // DEBUG: log errore dettagliato
                res.status(500).json({ error: 'Errore nel salvataggio su database MySQL', details: err.message });
            }
        })
        .on('error', (err) => {
            console.error('Errore nella lettura del CSV:', err); // DEBUG: log errore lettura CSV
            res.status(500).json({ error: 'Errore nella lettura del CSV', details: err.message });
        });
});

app.listen(3000, () => {
    console.log('Server avviato su http://localhost:3000');
});
