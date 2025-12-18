const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Cadastro
router.post('/register', authController.registerUser);

// Login
router.post('/login', authController.loginUser);

// Usuário logado + cargo
router.get('/me', authController.me);

// Verifica se o usuário logado é gerente (route leve) — não bloqueia com 401, apenas retorna isGerente boolean
router.get('/is-gerente', authController.isGerente);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
