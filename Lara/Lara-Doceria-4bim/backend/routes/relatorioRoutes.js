const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Relatórios - protegidos via verifyToken + verificarGerente na montagem das rotas
router.get('/pedidos-ano', relatorioController.pedidosAno);
router.get('/doce-mais-pedido', relatorioController.doceMaisPedido);

module.exports = router;
