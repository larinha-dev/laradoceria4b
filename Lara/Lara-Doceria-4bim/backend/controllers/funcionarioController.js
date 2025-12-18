const { query } = require('../database');

// Listar funcionários
exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query('SELECT * FROM funcionario ORDER BY pessoa_id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter funcionário
exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar funcionário
exports.criarFuncionario = async (req, res) => {
  try {
    const { pessoa_id_pessoa, cargo_funcionario, salario_funcionario } = req.body;

    const result = await query(
      'INSERT INTO funcionario (pessoa_id_pessoa, cargo_funcionario, salario_funcionario) VALUES ($1, $2, $3) RETURNING *',
      [pessoa_id_pessoa, cargo_funcionario, salario_funcionario]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cargo_funcionario, salario_funcionario } = req.body;

    const existing = await query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const current = existing.rows[0];
    const result = await query(
      'UPDATE funcionario SET cargo_funcionario = $1, salario_funcionario = $2 WHERE pessoa_id_pessoa = $3 RETURNING *',
      [
        cargo_funcionario ?? current.cargo_funcionario,
        salario_funcionario ?? current.salario_funcionario,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    await query('DELETE FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
