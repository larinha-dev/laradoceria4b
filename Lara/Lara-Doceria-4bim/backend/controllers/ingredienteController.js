const db = require('../database');
const path = require('path');

// ================================
// Abre a página do CRUD de Ingredientes
// ================================
exports.abrirCrudIngrediente = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/ingrediente/ingrediente.html'));
};

// ================================
// Lista todos os ingredientes
// ================================
exports.listarIngredientes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ingrediente ORDER BY id_ingrediente');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar ingredientes:', error);
    res.status(500).json({ error: 'Erro ao listar ingredientes' });
  }
};

// ================================
// Cria um novo ingrediente
// ================================
exports.criarIngrediente = async (req, res) => {
  try {
    const { nome_ingrediente, descricao_ingrediente } = req.body;

    if (!nome_ingrediente) {
      return res.status(400).json({ error: 'O nome do ingrediente é obrigatório' });
    }

    const result = await db.query(
      'INSERT INTO ingrediente (nome_ingrediente, descricao_ingrediente) VALUES ($1, $2) RETURNING *',
      [nome_ingrediente, descricao_ingrediente]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error);
    res.status(500).json({ error: 'Erro ao criar ingrediente' });
  }
};

// ================================
// Obtém um ingrediente pelo ID
// ================================
exports.obterIngrediente = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await db.query('SELECT * FROM ingrediente WHERE id_ingrediente = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar ingrediente:', error);
    res.status(500).json({ error: 'Erro ao buscar ingrediente' });
  }
};

// ================================
// Atualiza um ingrediente existente
// ================================
exports.atualizarIngrediente = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const { nome_ingrediente, descricao_ingrediente } = req.body;

    const result = await db.query(
      'UPDATE ingrediente SET nome_ingrediente = $1, descricao_ingrediente = $2 WHERE id_ingrediente = $3 RETURNING *',
      [nome_ingrediente, descricao_ingrediente, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    res.status(500).json({ error: 'Erro ao atualizar ingrediente' });
  }
};

// ================================
// Deleta um ingrediente
// ================================
exports.deletarIngrediente = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await db.query('DELETE FROM ingrediente WHERE id_ingrediente = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    res.status(500).json({ error: 'Erro ao deletar ingrediente' });
  }
};
