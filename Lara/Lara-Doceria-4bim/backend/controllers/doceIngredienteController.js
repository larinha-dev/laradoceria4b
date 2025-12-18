const { query } = require('../database');

// ================================
// Listar todas as relações doce ↔ ingrediente
// ================================
exports.listarDoceIngredientes = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM doce_has_ingrediente ORDER BY doce_id_doce, ingrediente_id_ingrediente'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar doce_ingrediente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Criar uma nova relação doce ↔ ingrediente
// ================================
exports.criarDoceIngrediente = async (req, res) => {
  try {
    const { doce_id_doce, ingrediente_id_ingrediente } = req.body;

    if (!doce_id_doce || !ingrediente_id_ingrediente) {
      return res.status(400).json({ error: 'IDs de doce e ingrediente são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO doce_has_ingrediente (doce_id_doce, ingrediente_id_ingrediente) VALUES ($1, $2) RETURNING *',
      [doce_id_doce, ingrediente_id_ingrediente]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar doce_ingrediente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Deletar uma relação doce ↔ ingrediente
// ================================
exports.deletarDoceIngrediente = async (req, res) => {
  try {
    const { doce_id_doce, ingrediente_id_ingrediente } = req.params;

    const result = await query(
      'DELETE FROM doce_has_ingrediente WHERE doce_id_doce = $1 AND ingrediente_id_ingrediente = $2 RETURNING *',
      [doce_id_doce, ingrediente_id_ingrediente]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relação doce ↔ ingrediente não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar doce_ingrediente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
