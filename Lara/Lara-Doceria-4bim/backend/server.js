// ==========================
// server.js - Doceria
// ==========================
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

// Importa a configuração do banco PostgreSQL
const db = require('./database'); // ajuste conforme a sua pasta

// Configurações do servidor
const HOST = 'localhost';
const PORT_FIXA = 3001;

// Define o caminho do frontend
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));

// Middlewares básicos
app.use(cookieParser());
app.use(express.json());

// ==========================
// CORS
// ==========================
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Permitir Authorization e x-access-token para que o frontend possa enviar o token
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ==========================
// Middleware para banco
// ==========================
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middleware de JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// ==========================
// Importando as rotas
// ==========================

// Importar controllers de autenticação para middlewares
const { verifyToken, verificarGerente } = require('./controllers/authController');

// Rotas principais da doceria (PROTEGIDAS - apenas gerentes)
const pessoaRoutes = require('./routes/pessoaRoutes');

const clienteRoutes = require('./routes/clienteRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');

const gerenteRoutes = require('./routes/gerenteRoutes');

const doceRoutes = require('./routes/doceRoutes');
app.use('/doce', doceRoutes);

const ingredienteRoutes = require('./routes/ingredienteRoutes');

const pedidoRoutes = require('./routes/pedidoRoutes');

const doceIngredienteRoutes = require('./routes/doceIngredienteRoutes');
// Montar rotas restantes
app.use('/pessoa', pessoaRoutes);
app.use('/cliente', clienteRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/gerente', gerenteRoutes);
app.use('/ingrediente', ingredienteRoutes);
app.use('/pedido', pedidoRoutes);
app.use('/doce-ingrediente', doceIngredienteRoutes);

// Rotas de autenticação (login e cadastro)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Rotas de pagamento (opcional)
const pixRoutes = require('./routes/pixRoutes');
app.use('/pix', pixRoutes);

// Rotas de relatórios (protegidas)
const relatorioRoutes = require('./routes/relatorioRoutes');
app.use('/relatorios', verifyToken, verificarGerente, relatorioRoutes);

// ==========================
// Rotas padrão
// ==========================
app.get('/', (req, res) => {
  res.sendFile(path.join(caminhoFrontend, 'index.html'));
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando corretamente',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================
// Erros e 404
// ==========================
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// ==========================
// Inicialização do servidor
// ==========================
const startServer = async () => {
  try {
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ Conexão PostgreSQL bem-sucedida!');
    const PORT = process.env.PORT || PORT_FIXA;

    // Garantir que o gerente mestre (id 28) exista e tenha senha conhecida ('mestre')
    try {
      const pessoaRes = await db.query('SELECT id_pessoa FROM pessoa WHERE id_pessoa = $1', [28]);
      if (pessoaRes.rowCount > 0) {
        const newHash = await bcrypt.hash('mestre', 10);
        await db.query('UPDATE pessoa SET senha_pessoa = $1, primeiro_acesso_pessoa = false WHERE id_pessoa = $2', [newHash, 28]);
        console.log('✅ Gerente mestre (id 28) senha ajustada para "mestre" (hash atualizado).');
      } else {
        // se não existir, criar registro mínimo
        const newHash = await bcrypt.hash('mestre', 10);
        await db.query(
          'INSERT INTO pessoa (id_pessoa, nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, primeiro_acesso_pessoa) VALUES ($1,$2,$3,$4,$5,$6)',
          [28, 'Gerente Mestre', 'gerente.mestre@doceria.com', newHash, '+5544999074747', false]
        );
        await db.query('INSERT INTO gerente (pessoa_id_pessoa) VALUES ($1)', [28]);
        console.log('✅ Gerente mestre criado com id 28 e senha "mestre".');
      }
      const gerenteRes = await db.query('SELECT pessoa_id_pessoa FROM gerente WHERE pessoa_id_pessoa = $1', [28]);
      if (gerenteRes.rowCount === 0) {
        await db.query('INSERT INTO gerente (pessoa_id_pessoa) VALUES ($1)', [28]);
        console.log('✅ Registro de gerente inserido para id 28.');
      }
    } catch (err) {
      console.error('Erro ao garantir gerente mestre:', err.message || err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor Doceria rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Encerramento seguro
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Inicia o servidor
startServer();
