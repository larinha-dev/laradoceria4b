const express = require('express');
const router = express.Router();
const doceController = require('../controllers/doceController');

// CRUD de Doces
router.get('/abrirCrudDoce', doceController.abrirCrudDoce);
router.get('/', doceController.listarDoces);
router.post('/', doceController.criarDoce);
router.get('/:id', doceController.obterDoce);
router.put('/:id', doceController.atualizarDoce);
router.delete('/:id', doceController.deletarDoce);

module.exports = router;
