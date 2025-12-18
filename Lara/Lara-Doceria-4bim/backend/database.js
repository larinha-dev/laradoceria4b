// ================================
// database.js - Conexão Doceria
// ================================
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',      // altere conforme seu PostgreSQL
  password: 'mr210909',  // altere conforme sua senha
  database: 'doceria',   // nome do banco de dados da doceria
  ssl: false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

const schema = 'public';

// ================================
// Pool de conexões
// ================================
const pool = new Pool({
  ...dbConfig,
  max: 10,
  min: 0,
  idle: 10000,
  acquire: 30000,
  evict: 1000
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// ================================
// Função para testar a conexão
// ================================
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL (Doceria) com sucesso!');
    await client.query(`SET search_path TO ${schema}`);
    // Checa e aplica pequenas migrações de schema necessárias (ex.: senha_pessoa maior)
    try {
      const colRes = await client.query(`SELECT character_maximum_length FROM information_schema.columns WHERE table_name='pessoa' AND column_name='senha_pessoa'`);
      if (colRes.rows.length > 0) {
        const maxLen = colRes.rows[0].character_maximum_length;
        if (!maxLen || maxLen < 60) {
          console.log('🔧 Ajustando tamanho da coluna senha_pessoa para suportar hashes maiores...');
          await client.query(`ALTER TABLE pessoa ALTER COLUMN senha_pessoa TYPE VARCHAR(128)`);
          console.log('✅ Migração aplicada: senha_pessoa agora é VARCHAR(128)');
        }
      }
    } catch (mErr) {
      console.warn('⚠️ Falha ao verificar/aplicar migração de schema (pode estar sem privilégio):', mErr.message || mErr);
    }
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com o PostgreSQL (Doceria):', err);
    return false;
  }
};

// ================================
// Função para executar queries simples
// ================================
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schema}`);
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar query no banco Doceria:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ================================
// Função para transações
// ================================
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO ${schema}`);

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na transação (Doceria):', error);
    throw error;
  } finally {
    client.release();
  }
};

// ================================
// Exporta o módulo
// ================================
module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
