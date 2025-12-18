const { query } = require('../database');
const path = require('path');

// ================================
// Abrir a página do CRUD de doces
// ================================
exports.abrirCrudDoce = (req, res) => {
  console.log('doceController - Rota /abrirCrudDoce - abrir o crudDoce');
  res.sendFile(path.join(__dirname, '../../frontend/doce/doce.html'));
};

// ================================
// Listar todos os doces
// ================================
exports.listarDoces = async (req, res) => {
  try {
    const result = await query('SELECT * FROM doce ORDER BY id_doce');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar doces:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Criar um novo doce
// ================================
exports.criarDoce = async (req, res) => {
  try {
    const { nome_doce, descricao_doce, preco_doce } = req.body;

    if (!nome_doce || !preco_doce) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO doce (nome_doce, descricao_doce, preco_doce) VALUES ($1, $2, $3) RETURNING *',
      [nome_doce, descricao_doce, preco_doce]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar doce:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Obter um doce pelo ID
// ================================
exports.obterDoce = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM doce WHERE id_doce = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doce não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter doce:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Atualizar um doce
// ================================
exports.atualizarDoce = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_doce, descricao_doce, preco_doce } = req.body;

    const existing = await query('SELECT * FROM doce WHERE id_doce = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Doce não encontrado' });
    }

    const current = existing.rows[0];
    const updated = {
      nome: nome_doce ?? current.nome_doce,
      descricao: descricao_doce ?? current.descricao_doce,
      preco: preco_doce ?? current.preco_doce
    };

    const result = await query(
      'UPDATE doce SET nome_doce = $1, descricao_doce = $2, preco_doce = $3 WHERE id_doce = $4 RETURNING *',
      [updated.nome, updated.descricao, updated.preco, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar doce:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Deletar um doce
// ================================
exports.deletarDoce = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await query('SELECT * FROM doce WHERE id_doce = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Doce não encontrado' });
    }

    await query('DELETE FROM doce WHERE id_doce = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar doce:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
