const express = require('express');
const router = express.Router();
const ingredienteController = require('../controllers/ingredienteController');

// CRUD de Ingredientes
router.get('/abrirCrudIngrediente', ingredienteController.abrirCrudIngrediente);
router.get('/', ingredienteController.listarIngredientes);
router.post('/', ingredienteController.criarIngrediente);
router.get('/:id', ingredienteController.obterIngrediente);
router.put('/:id', ingredienteController.atualizarIngrediente);
router.delete('/:id', ingredienteController.deletarIngrediente);

module.exports = router;
