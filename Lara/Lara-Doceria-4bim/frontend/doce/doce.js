const API_BASE_URL = 'http://localhost:3001';
let currentDoceId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('doceForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const docesTableBody = document.getElementById('docesTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', () => {
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('listSection').style.display = 'none';
});

// Event Listeners
btnBuscar.addEventListener('click', buscarDoce);
btnIncluir.addEventListener('click', incluirDoce);
btnAlterar.addEventListener('click', alterarDoce);
btnExcluir.addEventListener('click', excluirDoce);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// ================================
// Funções auxiliares
// ================================
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
}

function limparFormulario() { form.reset(); }

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// ================================
// CRUD - Doce
// ================================
async function buscarDoce() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        document.getElementById('listSection').style.display = 'none';
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/doce/${id}`, { headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        if (response.ok) {
            const doce = await response.json();
            preencherFormulario(doce);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Doce encontrado!', 'success');
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaDoces([doce]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Doce não encontrado. Você pode incluir um novo.', 'info');
            document.getElementById('listSection').style.display = 'none';
            renderizarTabelaDoces([]);
        } else {
            throw new Error('Erro ao buscar doce');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar doce', 'error');
        document.getElementById('listSection').style.display = 'none';
        renderizarTabelaDoces([]);
    }
}

function preencherFormulario(doce) {
    currentDoceId = doce.id_doce;
    searchId.value = doce.id_doce;
    document.getElementById('nome_doce').value = doce.nome_doce || '';
    document.getElementById('descricao_doce').value = doce.descricao_doce || '';
    document.getElementById('preco_doce').value = doce.preco_doce || '';
}

function incluirDoce() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_doce').focus();
    operacao = 'incluir';
}

function alterarDoce() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_doce').focus();
    operacao = 'alterar';
}

function excluirDoce() {
    mostrarMensagem('Excluindo doce...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const doce = {
        id_doce: searchId.value,
        nome_doce: formData.get('nome_doce'),
        descricao_doce: formData.get('descricao_doce'),
        preco_doce: formData.get('preco_doce')
    };
    let response;
    try {
        if (operacao === 'incluir') {
            const token = localStorage.getItem('token');
            response = await fetch(`${API_BASE_URL}/doce`, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
                body: JSON.stringify(doce),
                credentials: 'include'
            });
        } else if (operacao === 'alterar') {
            const token = localStorage.getItem('token');
            response = await fetch(`${API_BASE_URL}/doce/${currentDoceId}`, {
                method: 'PUT',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
                body: JSON.stringify(doce),
                credentials: 'include'
            });
        } else if (operacao === 'excluir') {
            const token = localStorage.getItem('token');
            response = await fetch(`${API_BASE_URL}/doce/${currentDoceId}`, { method: 'DELETE', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Doce ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarDoces();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar doce', 'error');
        } else {
            mostrarMensagem('Doce excluído com sucesso!', 'success');
            limparFormulario();
            carregarDoces();
        }
    } catch (error) {
        console.error(error);
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
// Tabela de doces
// ================================
async function carregarDoces() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/doce`, { headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        if (response.ok) {
            const doces = await response.json();
            renderizarTabelaDoces(doces);
        } else {
            throw new Error('Erro ao carregar doces');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar doces', 'error');
    }
}

function renderizarTabelaDoces(doces) {
    docesTableBody.innerHTML = '';
    doces.forEach(doce => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarDoce(${doce.id_doce})">${doce.id_doce}</button></td>
            <td>${doce.nome_doce}</td>
            <td>${doce.descricao_doce || ''}</td>
            <td>R$ ${Number(doce.preco_doce).toFixed(2)}</td>
        `;
        docesTableBody.appendChild(row);
    });
}

async function selecionarDoce(id) {
    searchId.value = id;
    await buscarDoce();
}
