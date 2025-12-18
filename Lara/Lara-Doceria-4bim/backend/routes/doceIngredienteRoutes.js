const express = require('express');
const router = express.Router();
const doceIngredienteController = require('../controllers/doceIngredienteController');

// CRUD de relação doce ↔ ingrediente
router.get('/', doceIngredienteController.listarDoceIngredientes);
router.post('/', doceIngredienteController.criarDoceIngrediente);
router.delete('/:doce_id_doce/:ingrediente_id_ingrediente', doceIngredienteController.deletarDoceIngrediente);

module.exports = router;
