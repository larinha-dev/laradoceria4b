// Ingredient CRUD adapted from doce.js
const API_BASE_URL = 'http://localhost:3001';
let currentIngredienteId = null;

// Elements
const form = document.getElementById('ingredienteForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const ingredientesTableBody = document.getElementById('ingredientesTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', () => {
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('listSection').style.display = 'none';
});

// Helpers
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

// CRUD - Ingrediente
async function buscarIngrediente() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        document.getElementById('listSection').style.display = 'none';
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/ingrediente/${id}`, { headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        if (response.ok) {
            const ingrediente = await response.json();
            preencherFormulario(ingrediente);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Ingrediente encontrado!', 'success');
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaIngredientes([ingrediente]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Ingrediente não encontrado. Você pode incluir um novo.', 'info');
            document.getElementById('listSection').style.display = 'none';
            renderizarTabelaIngredientes([]);
        } else {
            throw new Error('Erro ao buscar ingrediente');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar ingrediente', 'error');
        document.getElementById('listSection').style.display = 'none';
        renderizarTabelaIngredientes([]);
    }
}

function preencherFormulario(ingrediente) {
    currentIngredienteId = ingrediente.id_ingrediente;
    searchId.value = ingrediente.id_ingrediente;
    document.getElementById('nome_ingrediente').value = ingrediente.nome_ingrediente || '';
    document.getElementById('descricao_ingrediente').value = ingrediente.descricao_ingrediente || '';
}

function incluirIngrediente() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_ingrediente').focus();
    operacao = 'incluir';
}

function alterarIngrediente() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_ingrediente').focus();
    operacao = 'alterar';
}

function excluirIngrediente() {
    mostrarMensagem('Excluindo ingrediente...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const ingrediente = {
        id_ingrediente: searchId.value,
        nome_ingrediente: formData.get('nome_ingrediente'),
        descricao_ingrediente: formData.get('descricao_ingrediente')
    };
    let response;
    try {
        const token = localStorage.getItem('token');
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/ingrediente`, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
                body: JSON.stringify(ingrediente),
                credentials: 'include'
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/ingrediente/${currentIngredienteId}`, {
                method: 'PUT',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
                body: JSON.stringify(ingrediente),
                credentials: 'include'
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/ingrediente/${currentIngredienteId}`, { method: 'DELETE', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Ingrediente ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarIngredientes();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar ingrediente', 'error');
        } else {
            mostrarMensagem('Ingrediente excluído com sucesso!', 'success');
            limparFormulario();
            carregarIngredientes();
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

// Tabela de ingredientes
async function carregarIngredientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/ingrediente`, { headers: token ? { 'Authorization': 'Bearer ' + token } : {}, credentials: 'include' });
        if (response.ok) {
            const ingredientes = await response.json();
            renderizarTabelaIngredientes(ingredientes);
        } else {
            throw new Error('Erro ao carregar ingredientes');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar ingredientes', 'error');
    }
}

function renderizarTabelaIngredientes(ingredientes) {
    ingredientesTableBody.innerHTML = '';
    ingredientes.forEach(it => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarIngrediente(${it.id_ingrediente})">${it.id_ingrediente}</button></td>
            <td>${it.nome_ingrediente}</td>
            <td>${it.descricao_ingrediente || ''}</td>
        `;
        ingredientesTableBody.appendChild(row);
    });
}

async function selecionarIngrediente(id) {
    searchId.value = id;
    await buscarIngrediente();
}

// Event listeners
btnBuscar.addEventListener('click', buscarIngrediente);
btnIncluir.addEventListener('click', incluirIngrediente);
btnAlterar.addEventListener('click', alterarIngrediente);
btnExcluir.addEventListener('click', excluirIngrediente);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

carregarIngredientes();
