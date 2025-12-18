const pedido = JSON.parse(localStorage.getItem('pedidoResumo'));
const resumoContainer = document.getElementById('resumoContainer');
const btnCancelar = document.getElementById('btnCancelar');
const btnConfirmar = document.getElementById('btnConfirmar');

// Busca nome do cliente
async function obterNomeCliente(id) {
  try {
    const res = await fetch(`/pessoa/${id}`, { credentials: 'include' });
    if (res.ok) {
      const pessoa = await res.json();
      return pessoa.nome_pessoa || `Cliente ${id}`;
    }
  } catch (err) {
    console.error('Erro ao buscar pessoa:', err);
  }
  return `Cliente ${id}`;
}

// Renderiza a tabela do pedido
async function renderizarResumo() {
  if (!pedido) {
    resumoContainer.innerHTML = '<p>Nenhum pedido para mostrar.</p>';
    btnCancelar.style.display = 'none';
    btnConfirmar.style.display = 'none';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Doce</th>
          <th>Quantidade</th>
          <th>Preço Unitário</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
  `;

  pedido.doces.forEach(doce => {
    html += `
      <tr>
        <td>${doce.nome_doce || doce.doce_id_doce}</td>
        <td>${doce.quantidade}</td>
        <td>R$ ${Number(doce.preco_doce).toFixed(2)}</td>
        <td>R$ ${(doce.preco_doce * doce.quantidade).toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <h3>Total: R$ ${Number(pedido.valor_total).toFixed(2)}</h3>
  `;

  resumoContainer.innerHTML = html;
}

// Botão cancelar
btnCancelar.onclick = () => {
  localStorage.removeItem('pedidoResumo');
  window.location.href = 'cardapio.html';
};

// Botão confirmar pedido
btnConfirmar.onclick = async () => {
  try {
    const pedido = JSON.parse(localStorage.getItem('pedidoResumo'));

    const pedidoParaEnviar = {
      cliente_pessoa_id_pessoa: pedido.cliente_pessoa_id_pessoa,
      valor_total: pedido.valor_total,
      doces: pedido.doces.map(d => ({
        doce_id_doce: d.doce_id_doce,
        quantidade: d.quantidade
      }))
    };

    const response = await fetch('/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoParaEnviar)
    });

    if (response.ok) {
      window.location.href = '../pagamento/pagamento.html';
    } else {
      const erro = await response.json();
      alert('Erro ao confirmar pedido: ' + (erro.error || 'Erro desconhecido'));
    }
  } catch (error) {
    alert('Erro de conexão com o servidor.');
  }
};

// Carrega o resumo ao entrar
renderizarResumo();
