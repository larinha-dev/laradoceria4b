const pedido = JSON.parse(localStorage.getItem('pedidoResumo'));
const qrCodeArea = document.getElementById('qrCodeArea');
const valorPix = document.getElementById('valorPix');
const pixPayload = document.getElementById('pixPayload');

// Configuração da chave PIX
const chavePix = '+5544999074747';
const nomeRecebedor = 'Luiza Marcacini Rodolfo';
const cidadeRecebedor = 'Peabiru';

async function gerarPix() {
  if (!pedido || !pedido.valor_total) {
    qrCodeArea.innerHTML = '<p>❌ Nenhum pedido encontrado.</p>';
    return;
  }
  
  const valor = Number(pedido.valor_total).toFixed(2);
  valorPix.textContent = `Valor: R$ ${valor}`;
  
  try {
    // Chamar API para gerar PIX com valor
    const res = await fetch('/pix/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valor: valor,
        chave: chavePix,
        nome: nomeRecebedor,
        cidade: cidadeRecebedor
      })
    });
    
    if (!res.ok) throw new Error('Erro ao gerar PIX');
    
    const data = await res.json();
    const payload = data.payload;
    
    if (!payload) {
      throw new Error('Payload vazio');
    }
    
    // Gerar QR Code
    qrCodeArea.innerHTML = '';
    new QRCode(qrCodeArea, {
      text: payload,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // Mostrar copia e cola
    pixPayload.textContent = `Copia e Cola PIX: ${payload}`;
    
  } catch (err) {
    console.error('Erro:', err);
    qrCodeArea.innerHTML = '<p>❌ Erro ao gerar QR Code.</p>';
  }
}

// Gerar PIX ao carregar a página
gerarPix();