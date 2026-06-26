const express = require('express');
const router = express.Router();
const { queryOne, queryAll, run } = require('../db/database');

// GET all users
router.get('/usuarios', (req, res) => {
  const usuarios = queryAll('SELECT id, nombre, alias, saldo FROM usuarios ORDER BY nombre');
  res.json(usuarios);
});

// POST transferencia
router.post('/transferir', (req, res) => {
  const { alias_origen, alias_destino, monto } = req.body;

  if (!alias_origen || !alias_destino || !monto) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'Monto inválido' });
  }

  if (alias_origen === alias_destino) {
    run(`INSERT INTO transferencias (alias_origen, alias_destino, monto, estado, mensaje) VALUES (?,?,?,?,?)`,
      [alias_origen, alias_destino, montoNum, 'rechazada', 'No puede transferirse a sí mismo']);
    return res.status(400).json({ estado: 'rechazada', mensaje: 'No puede transferirse a sí mismo' });
  }

  // Validar alias origen
  const userOrigen = queryOne('SELECT * FROM usuarios WHERE alias = ?', [alias_origen]);
  if (!userOrigen) {
    run(`INSERT INTO transferencias (alias_origen, alias_destino, monto, estado, mensaje) VALUES (?,?,?,?,?)`,
      [alias_origen, alias_destino, montoNum, 'rechazada', 'Alias de origen no encontrado']);
    return res.status(404).json({ estado: 'rechazada', mensaje: 'Alias de origen no encontrado' });
  }

  // Validar alias destino
  const userDestino = queryOne('SELECT * FROM usuarios WHERE alias = ?', [alias_destino]);
  if (!userDestino) {
    run(`INSERT INTO transferencias (alias_origen, alias_destino, monto, estado, mensaje) VALUES (?,?,?,?,?)`,
      [alias_origen, alias_destino, montoNum, 'rechazada', 'Alias destino no existe en el sistema']);
    return res.status(404).json({ estado: 'rechazada', mensaje: 'Alias destino no existe en el sistema' });
  }

  // Validar saldo disponible
  if (userOrigen.saldo < montoNum) {
    run(`INSERT INTO transferencias (alias_origen, alias_destino, monto, estado, mensaje) VALUES (?,?,?,?,?)`,
      [alias_origen, alias_destino, montoNum, 'rechazada', 'Saldo insuficiente en la billetera']);
    return res.status(400).json({ estado: 'rechazada', mensaje: 'Saldo insuficiente en la billetera' });
  }

  // Realizar transferencia
  run('UPDATE usuarios SET saldo = saldo - ? WHERE alias = ?', [montoNum, alias_origen]);
  run('UPDATE usuarios SET saldo = saldo + ? WHERE alias = ?', [montoNum, alias_destino]);

  run(`INSERT INTO transferencias (alias_origen, alias_destino, monto, estado, mensaje) VALUES (?,?,?,?,?)`,
    [alias_origen, alias_destino, montoNum, 'realizada', `Transferencia exitosa de $${montoNum} a ${alias_destino}`]);

  res.json({
    estado: 'realizada',
    mensaje: `Transferencia de $${montoNum} realizada con éxito a ${userDestino.nombre}`,
    nuevo_saldo: userOrigen.saldo - montoNum
  });
});

// GET historial de transferencias
router.get('/historial', (req, res) => {
  const historial = queryAll('SELECT * FROM transferencias ORDER BY fecha DESC LIMIT 20');
  res.json(historial);
});

module.exports = router;
