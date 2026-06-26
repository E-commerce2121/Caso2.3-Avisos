const express = require('express');
const router = express.Router();
const { queryOne, queryAll, run } = require('../db/database');

// GET cola actual de avisos
router.get('/cola', (req, res) => {
  const cola = queryAll(`SELECT * FROM cola_avisos WHERE estado = 'esperando' ORDER BY posicion_actual ASC`);
  res.json(cola);
});

// POST agregar aviso / actualizar posición
router.post('/agregar', (req, res) => {
  const { correo, posicion_actual } = req.body;

  if (!correo || posicion_actual === undefined) {
    return res.status(400).json({ error: 'Correo y posición actual son requeridos' });
  }

  const posNum = parseInt(posicion_actual);
  if (isNaN(posNum) || posNum < 1) {
    return res.status(400).json({ error: 'Posición inválida, debe ser un número mayor a 0' });
  }

  // Verificar si ya existe en cola
  const existing = queryOne(`SELECT * FROM cola_avisos WHERE correo = ? AND estado = 'esperando'`, [correo]);

  if (existing) {
    const posAnterior = existing.posicion_actual;

    // Actualizar posición
    run(`UPDATE cola_avisos SET posicion_actual = ?, posicion_anterior = ? WHERE id = ?`,
      [posNum, posAnterior, existing.id]);

    // Si avanzó (posición_actual > posición_anterior = subió más arriba en cola)
    if (posNum > posAnterior) {
      return res.json({
        estado: 'actualizado',
        avanzó: true,
        mensaje: `Posición actualizada de ${posAnterior} a ${posNum}. Su aviso avanzó en la cola.`,
        posicion_actual: posNum,
        posicion_anterior: posAnterior
      });
    } else {
      return res.json({
        estado: 'actualizado',
        avanzó: false,
        mensaje: `Posición actualizada. Continúe esperando, ya se enviará su aviso.`,
        posicion_actual: posNum,
        posicion_anterior: posAnterior
      });
    }
  }

  // Nuevo en cola
  run(`INSERT INTO cola_avisos (correo, posicion_actual) VALUES (?,?)`, [correo, posNum]);

  res.json({
    estado: 'agregado',
    mensaje: `Correo ${correo} agregado a la cola en posición ${posNum}`,
    posicion_actual: posNum
  });
});

// POST procesar aviso (enviar al primero de la cola)
router.post('/procesar', (req, res) => {
  const primero = queryOne(`SELECT * FROM cola_avisos WHERE estado = 'esperando' ORDER BY posicion_actual DESC LIMIT 1`);

  if (!primero) {
    return res.json({ mensaje: 'No hay avisos pendientes en la cola' });
  }

  // Marcar como enviado
  run(`UPDATE cola_avisos SET estado = 'enviado' WHERE id = ?`, [primero.id]);
  run(`INSERT INTO log_avisos (correo, mensaje) VALUES (?,?)`,
    [primero.correo, `Aviso de stock enviado correctamente al correo ${primero.correo} (estaba en posición ${primero.posicion_actual})`]);

  res.json({
    estado: 'enviado',
    mensaje: `Su correo de aviso se envió correctamente a ${primero.correo}`,
    correo: primero.correo,
    posicion: primero.posicion_actual
  });
});

// GET log de avisos enviados
router.get('/log', (req, res) => {
  const logs = queryAll('SELECT * FROM log_avisos ORDER BY fecha DESC LIMIT 20');
  res.json(logs);
});

// DELETE limpiar cola
router.delete('/limpiar', (req, res) => {
  run(`DELETE FROM cola_avisos WHERE estado = 'esperando'`);
  res.json({ mensaje: 'Cola limpiada correctamente' });
});

module.exports = router;
