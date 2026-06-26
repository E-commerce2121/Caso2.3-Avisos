const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { getDB } = require('./db/database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.redirect('/transferencias.html');
});

// Initialize DB before starting
getDB().then(() => {
  console.log('✅ Base de datos inicializada correctamente');

  // Routes
  app.use('/api/transferencias', require('./routes/transferencias'));
  app.use('/api/gimnasio', require('./routes/gimnasio'));
  app.use('/api/avisos', require('./routes/avisos'));

  // Fallback to index.html
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📦 Casos disponibles: 2.1 Transferencias | 2.2 Gimnasio | 2.3 Avisos Stock`);
  });
}).catch(err => {
  console.error('❌ Error al inicializar la base de datos:', err);
  process.exit(1);
});
