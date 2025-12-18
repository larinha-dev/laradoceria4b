const API_BASE_URL = 'http://localhost:3001';
let currentPedidoId = null;
let operacao = null;
let docesPedido = [];
let docesDisponiveis = [];

const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');
const docesList = document.getElementById('docesList');
const doceSelect = document.getElementById('doceSelect');
const doceQuantidade = document.getElementById('doceQuantidade');
const btnAddDoce = document.getElementById('btnAddDoce');

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDocesDisponiveis();
    carregarPedidos();
});

btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);
btnAddDoce.addEventListener('click', adicionarDoceAoPedido);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) input.disabled = bloquearPrimeiro;
        else input.disabled = !bloquearPrimeiro;
    });
    doceSelect.disabled = !bloquearPrimeiro;
    doceQuantidade.disabled = !bloquearPrimeiro;
    btnAddDoce.disabled = !bloquearPrimeiro;
}

function limparFormulario() {
    form.reset();
    docesPedido = [];
    renderizarDocesPedido();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// ================================
// Carregar doces disponíveis
// ================================
async function carregarDocesDisponiveis() {
    try {
        const response = await fetch(`${API_BASE_URL}/doce`);
        if (response.ok) {
            docesDisponiveis = await response.json();
            doceSelect.innerHTML = docesDisponiveis.map(doce =>
                `<option value="${doce.id_doce}">${doce.nome_doce || 'Doce ' + doce.id_doce}</option>`
            ).join('');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar doces disponíveis', 'error');
    }
}

// ================================
// Adicionar e remover doces do pedido
// ================================
function adicionarDoceAoPedido() {
    const doceId = parseInt(doceSelect.value);
    const quantidade = parseInt(doceQuantidade.value);
    if (!doceId || !quantidade || quantidade < 1) {
        mostrarMensagem('Selecione um doce e quantidade válida', 'warning');
        return;
    }
    const existente = docesPedido.find(d => d.doce_id_doce === doceId);
    if (existente) {
        existente.quantidade += quantidade;
    } else {
        docesPedido.push({ doce_id_doce: doceId, quantidade });
    }
    renderizarDocesPedido();
}

function removerDoceDoPedido(doceId) {
    docesPedido = docesPedido.filter(d => d.doce_id_doce !== doceId);
    renderizarDocesPedido();
}

function renderizarDocesPedido() {
    docesList.innerHTML = '';
    if (docesPedido.length === 0) {
        docesList.innerHTML = '<em>Nenhum doce adicionado.</em>';
        return;
    }
    docesPedido.forEach(item => {
        const doce = docesDisponiveis.find(d => d.id_doce === item.doce_id_doce);
        const nome = doce ? doce.nome_doce : 'Doce ' + item.doce_id_doce;
        const div = document.createElement('div');
        div.innerHTML = `${nome} - Quantidade: ${item.quantidade} <button type="button" onclick="removerDoceDoPedido(${item.doce_id_doce})">Remover</button>`;
        docesList.appendChild(div);
    });
}

// ================================
// Buscar e preencher formulário
// ================================
async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaPedidos([pedido]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo.', 'info');
            document.getElementById('listSection').style.display = 'none';
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        mostrarMensagem('Erro ao buscar pedido', 'error');
        document.getElementById('listSection').style.display = 'none';
    }
}

function preencherFormulario(pedido) {
    currentPedidoId = pedido.id_pedido;
    searchId.value = pedido.id_pedido;
    document.getElementById('cliente_pessoa_id_pessoa').value = pedido.cliente_pessoa_id_pessoa || '';
    document.getElementById('valor_total').value = pedido.valor_total || '';
    document.getElementById('status_pedido').value = pedido.status_pedido || '';
    document.getElementById('data_pedido').value = pedido.data_pedido
        ? pedido.data_pedido.slice(0, 16)
        : '';
    docesPedido = Array.isArray(pedido.doces) ? pedido.doces.map(d => ({
        doce_id_doce: d.doce_id_doce,
        quantidade: d.quantidade
    })) : [];
    renderizarDocesPedido();
}

// ================================
// CRUD de pedidos
// ================================
function incluirPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_pessoa_id_pessoa').focus();
    operacao = 'incluir';
}

function alterarPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_pessoa_id_pessoa').focus();
    operacao = 'alterar';
}

function excluirPedido() {
    mostrarMensagem('Excluindo pedido...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pedido = {
        cliente_pessoa_id_pessoa: formData.get('cliente_pessoa_id_pessoa'),
        valor_total: formData.get('valor_total'),
        status_pedido: formData.get('status_pedido'),
        data_pedido: formData.get('data_pedido'),
        doces: docesPedido
    };
    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Pedido ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarPedidos();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar pedido', 'error');
        } else {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            limparFormulario();
            carregarPedidos();
        }
    } catch (error) {
        mostrarMensagem('Erro na operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    mostrarMensagem('Operação cancelada', 'info');
}

// ================================
// Listar e exibir pedidos
// ================================
async function carregarPedidos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedido`);
        if (response.ok) {
            const pedidos = await response.json();
            renderizarTabelaPedidos(pedidos);
        } else {
            throw new Error('Erro ao carregar pedidos');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar pedidos', 'error');
    }
}

function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';
    pedidos.forEach(pedido => {
        const docesStr = Array.isArray(pedido.doces)
            ? pedido.doces.map(d => {
                const doce = docesDisponiveis.find(dd => dd.id_doce === d.doce_id_doce);
                const nome = doce ? doce.nome_doce : 'Doce ' + d.doce_id_doce;
                return `${nome} (x${d.quantidade})`;
            }).join(', ')
            : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarPedido(${pedido.id_pedido})">${pedido.id_pedido}</button></td>
            <td>${pedido.cliente_pessoa_id_pessoa}</td>
            <td>R$ ${Number(pedido.valor_total).toFixed(2)}</td>
            <td>${pedido.status_pedido}</td>
            <td>${pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleString() : ''}</td>
            <td>${docesStr}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}

window.removerDoceDoPedido = removerDoceDoPedido;
