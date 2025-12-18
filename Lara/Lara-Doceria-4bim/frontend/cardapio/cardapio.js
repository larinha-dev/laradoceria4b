// cardapio.js - versão DOCERIA
// Use caminhos relativos para evitar problemas com CORS quando o frontend for servido pelo backend
const API_BASE_URL = "";

// Obtém cliente logado do localStorage, se não existir usar 1 (somente demo)
const storedUser = JSON.parse(localStorage.getItem('usuario')) || null;
const CLIENTE_ID = storedUser ? storedUser.id : null; // null para pedidos anônimos - backend criará um cliente se necessário

let carrinho = [];

document.addEventListener("DOMContentLoaded", carregarCardapio);

async function carregarCardapio() {
  try {
    // Rota do backend: /doce (listar)
    const response = await fetch(`${API_BASE_URL}/doce`, { credentials: 'include' });
    const doces = await response.json();

    renderizarCardapio(doces);

  } catch (error) {
    mostrarMensagem("Erro ao carregar cardápio", "error");
  }
}

function renderizarCardapio(doces) {
  const container = document.getElementById("cardapioContainer");
  container.innerHTML = "";

  doces.forEach((doce) => {
    const card = document.createElement("div");
    card.classList.add("card-pizza"); // você pode renomear no CSS depois

    card.innerHTML = `
      <h2>${doce.nome_doce}</h2>
      <p>${doce.descricao_doce || "Sem descrição disponível"}</p>
      <p><strong>R$ ${Number(doce.preco_doce).toFixed(2)}</strong></p>

      <label>
        Quantidade:
        <input type="number" id="qtd-${doce.id_doce}" min="1" value="1" />
      </label>

      <button class="btn-add"
        onclick="adicionarAoPedido(${doce.id_doce}, '${doce.nome_doce}', ${doce.preco_doce})">
        Adicionar ao Pedido
      </button>
    `;

    container.appendChild(card);
  });
}

function adicionarAoPedido(id, nome, preco) {
  const qtdInput = document.getElementById(`qtd-${id}`);
  const quantidade = parseInt(qtdInput.value);

  if (quantidade <= 0) return;

  const existente = carrinho.find((item) => item.id === id);

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    carrinho.push({ id, nome, preco, quantidade });
  }

  renderizarTabelaPedido();
}

function renderizarTabelaPedido() {
  const tabela = document.getElementById("tabelaPedido");
  tabela.innerHTML = "";

  if (carrinho.length === 0) {
    tabela.innerHTML = "<tr><td colspan='4'>Nenhum item no pedido.</td></tr>";
    return;
  }

  carrinho.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.quantidade}</td>
      <td>R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
      <td><button onclick="removerItem(${index})">❌</button></td>
    `;

    tabela.appendChild(row);
  });

  const total = carrinho.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  const totalRow = document.createElement("tr");

  totalRow.innerHTML = `
    <td colspan="2"><strong>Total</strong></td>
    <td colspan="2"><strong>R$ ${total.toFixed(2)}</strong></td>
  `;

  tabela.appendChild(totalRow);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  renderizarTabelaPedido();
}

async function finalizarPedido() {
  if (carrinho.length === 0) {
    alert("Adicione doces ao pedido antes de finalizar!");
    return;
  }

  const valorTotal = carrinho.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  // 🔥 Nome adaptado para DOCES
  const pedido = {
    cliente_pessoa_id_pessoa: CLIENTE_ID,
    valor_total: valorTotal,
    doces: carrinho.map((item) => ({
      doce_id_doce: item.id,
      nome_doce: item.nome,
      preco_doce: item.preco,
      quantidade: item.quantidade
    })),
  };

  localStorage.setItem("pedidoResumo", JSON.stringify(pedido));
  window.location.href = "resumoPedido.html";
}
