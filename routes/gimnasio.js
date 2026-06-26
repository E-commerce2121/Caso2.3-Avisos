const express = require('express');
const router = express.Router();
const { queryOne, queryAll, run } = require('../db/database');

// GET all credentials for reference
router.get('/credenciales', (req, res) => {
  const usuarios = queryAll('SELECT nombre, alias, credencial, vencimiento_credencial FROM usuarios ORDER BY nombre');
  res.json(usuarios);
});

// POST validar acceso
router.post('/validar', (req, res) => {
  const { credencial } = req.body;

  if (!credencial) {
    return res.status(400).json({ error: 'Credencial requerida' });
  }

  const usuario = queryOne('SELECT * FROM usuarios WHERE credencial = ?', [credencial]);

  if (!usuario) {
    run(`INSERT INTO accesos_gimnasio (credencial, estado, mensaje) VALUES (?,?,?)`,
      [credencial, 'denegado', 'Credencial no registrada en el sistema']);
    return res.status(404).json({
      estado: 'denegado',
      mensaje: 'Credencial no registrada en el sistema'
    });
  }

  const hoy = new Date();
  const vencimiento = new Date(usuario.vencimiento_credencial);

  if (vencimiento < hoy) {
    run(`INSERT INTO accesos_gimnasio (credencial, estado, mensaje) VALUES (?,?,?)`,
      [credencial, 'denegado', `Credencial vencida el ${usuario.vencimiento_credencial}. El usuario debe renovar su membresía.`]);
    return res.status(403).json({
      estado: 'denegado',
      mensaje: `Credencial vencida el ${new Date(usuario.vencimiento_credencial).toLocaleDateString('es-AR')}. Debe renovar su membresía.`,
      usuario: usuario.nombre
    });
  }

  run(`INSERT INTO accesos_gimnasio (credencial, estado, mensaje) VALUES (?,?,?)`,
    [credencial, 'permitido', `Acceso permitido para ${usuario.nombre}`]);

  res.json({
    estado: 'permitido',
    mensaje: `Bienvenido/a, ${usuario.nombre}!`,
    usuario: usuario.nombre,
    vencimiento: new Date(usuario.vencimiento_credencial).toLocaleDateString('es-AR')
  });
});

// GET historial accesos
router.get('/historial', (req, res) => {
  const historial = queryAll('SELECT * FROM accesos_gimnasio ORDER BY fecha DESC LIMIT 20');
  res.json(historial);
});

module.exports = router;
