const express = require('express');
const router = express.Router();
const { QrCodePix } = require('qrcode-pix');

router.post('/gerar', async (req, res) => {
  const { valor, chave, nome, cidade } = req.body;
  
  try {
    if (!valor || !chave || !nome || !cidade) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const numValor = Number(valor);
    if (isNaN(numValor) || numValor <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    
    // Criar QR Code PIX com a biblioteca oficial
    const qrCodePix = QrCodePix({
      version: '01',
      key: chave,
      name: nome,
      city: cidade,
      value: numValor  // Valor em reais
    });
    
    // Gerar payload
    const payload = qrCodePix.payload();
    
    if (!payload) {
      throw new Error('Falha ao gerar payload PIX');
    }
    
    res.json({ 
      payload,
      valor: numValor.toFixed(2)
    });
    
  } catch (error) {
    console.error('Erro ao gerar PIX:', error.message);
    res.status(500).json({ error: 'Erro ao gerar QR Code PIX', details: error.message });
  }
});

module.exports = router;