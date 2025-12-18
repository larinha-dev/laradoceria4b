const { query } = require('../database');
const bcrypt = require('bcryptjs');
const path = require('path');

// ================================
// Abre a página do CRUD
// ================================
exports.abrirCrudPedido = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
};

// ================================
// Lista todos os pedidos com seus doces
// ================================
exports.listarPedidos = async (req, res) => {
  try {
    const pedidos = await query('SELECT * FROM pedido ORDER BY id_pedido');

    for (const pedido of pedidos.rows) {
      const itens = await query(
        'SELECT doce_id_doce, quantidade FROM pedido_has_doce WHERE pedido_id_pedido = $1',
        [pedido.id_pedido]
      );
      pedido.doces = itens.rows;
    }

    res.json(pedidos.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Cria um novo pedido e seus itens
// ================================
// Se cliente não existir, cria uma pessoa+cliente anônima e retorna o id
async function ensureClienteExists(clienteId) {
  if (clienteId) {
    const existing = await query('SELECT 1 FROM cliente WHERE pessoa_id_pessoa = $1', [clienteId]);
    if (existing.rows.length > 0) return clienteId;
  }

  // cria pessoa anônima com email único e senha gerada
  const anonEmail = `anon+${Date.now()}@local.dev`;
  const senhaHash = await bcrypt.hash('anon1234', 8);
  const pessoaResult = await query(
    'INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, primeiro_acesso_pessoa) VALUES ($1, $2, $3, $4) RETURNING id_pessoa',
    ['Consumidor Anônimo', anonEmail, senhaHash, false]
  );
  const idPessoa = pessoaResult.rows[0].id_pessoa;
  await query('INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES ($1, $2)', [idPessoa, 'Pedido Anônimo']);
  return idPessoa;
}

exports.criarPedido = async (req, res) => {
  try {
    let { cliente_pessoa_id_pessoa, valor_total, status_pedido, data_pedido, doces } = req.body;

    if (!valor_total || !Array.isArray(doces) || doces.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    // Garante que existe um cliente válido (ou cria um anônimo automaticamente)
    cliente_pessoa_id_pessoa = await ensureClienteExists(cliente_pessoa_id_pessoa);

    // Se a data não for fornecida, usar DEFAULT do DB (omitindo o campo) para evitar violação de NOT NULL
    let insertSQL = 'INSERT INTO pedido (cliente_pessoa_id_pessoa, valor_total, status_pedido) VALUES ($1, $2, $3) RETURNING *';
    const parametros = [cliente_pessoa_id_pessoa, valor_total, status_pedido ?? 'Pendente'];
    if (data_pedido && String(data_pedido).trim() !== '') {
      insertSQL = 'INSERT INTO pedido (cliente_pessoa_id_pessoa, valor_total, status_pedido, data_pedido) VALUES ($1, $2, $3, $4) RETURNING *';
      parametros.push(data_pedido);
    }
    const pedidoResult = await query(insertSQL, parametros);

    const pedido = pedidoResult.rows[0];

    for (const item of doces) {
      await query(
        'INSERT INTO pedido_has_doce (pedido_id_pedido, doce_id_doce, quantidade) VALUES ($1, $2, $3)',
        [pedido.id_pedido, item.doce_id_doce, item.quantidade ?? 1]
      );
    }

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Busca um pedido por ID
// ================================
exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const pedido = pedidoResult.rows[0];

    const itens = await query(
      'SELECT doce_id_doce, quantidade FROM pedido_has_doce WHERE pedido_id_pedido = $1',
      [id]
    );

    pedido.doces = itens.rows;
    res.json(pedido);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Atualiza pedido e seus itens
// ================================
exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cliente_pessoa_id_pessoa, valor_total, status_pedido, data_pedido, doces } = req.body;

    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const current = pedidoResult.rows[0];
    const updated = {
      cliente: cliente_pessoa_id_pessoa ?? current.cliente_pessoa_id_pessoa,
      valor: valor_total ?? current.valor_total,
      status: status_pedido ?? current.status_pedido,
      data: data_pedido && data_pedido.trim() !== '' ? data_pedido : current.data_pedido
    };

    const result = await query(
      'UPDATE pedido SET cliente_pessoa_id_pessoa = $1, valor_total = $2, status_pedido = $3, data_pedido = $4 WHERE id_pedido = $5 RETURNING *',
      [updated.cliente, updated.valor, updated.status, updated.data, id]
    );

    // Atualiza os itens (doces) do pedido
    if (Array.isArray(doces)) {
      await query('DELETE FROM pedido_has_doce WHERE pedido_id_pedido = $1', [id]);
      for (const item of doces) {
        await query(
          'INSERT INTO pedido_has_doce (pedido_id_pedido, doce_id_doce, quantidade) VALUES ($1, $2, $3)',
          [id, item.doce_id_doce, item.quantidade ?? 1]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ================================
// Exclui pedido e seus itens
// ================================
exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await query('DELETE FROM pedido_has_doce WHERE pedido_id_pedido = $1', [id]);
    await query('DELETE FROM pedido WHERE id_pedido = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
