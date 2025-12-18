-- Criando o schema e configurando o search_path
SET search_path TO public;

-- =======================
-- Tabela pessoa (clientes, funcionários, gerentes)
-- =======================
CREATE TABLE pessoa (
  id_pessoa SERIAL PRIMARY KEY,
  nome_pessoa VARCHAR(50) NOT NULL,
  email_pessoa VARCHAR(70) NOT NULL UNIQUE,
  senha_pessoa VARCHAR(128) NOT NULL,
  telefone_pessoa VARCHAR(20),
  primeiro_acesso_pessoa BOOLEAN NOT NULL DEFAULT TRUE,
  data_nascimento DATE DEFAULT NULL
);

-- =======================
-- Tabela cliente
-- =======================
CREATE TABLE cliente (
  pessoa_id_pessoa INTEGER PRIMARY KEY,
  endereco_cliente VARCHAR(100) NOT NULL,
  CONSTRAINT fk_cliente_pessoa FOREIGN KEY (pessoa_id_pessoa)
    REFERENCES pessoa (id_pessoa)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================
-- Tabela funcionario
-- =======================
CREATE TABLE funcionario (
  pessoa_id_pessoa INTEGER PRIMARY KEY,
  cargo_funcionario VARCHAR(45) NOT NULL,
  salario_funcionario NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_funcionario_pessoa FOREIGN KEY (pessoa_id_pessoa)
    REFERENCES pessoa (id_pessoa)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================
-- Tabela gerente
-- =======================
CREATE TABLE gerente (
  pessoa_id_pessoa INTEGER PRIMARY KEY,
  CONSTRAINT fk_gerente_pessoa FOREIGN KEY (pessoa_id_pessoa)
    REFERENCES pessoa (id_pessoa)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================
-- Tabela doce
-- =======================
CREATE TABLE doce (
  id_doce SERIAL PRIMARY KEY,
  nome_doce VARCHAR(50) NOT NULL,
  descricao_doce VARCHAR(255),
  preco_doce NUMERIC(10,2) NOT NULL
);

-- =======================
-- Tabela ingrediente
-- =======================
CREATE TABLE ingrediente (
  id_ingrediente SERIAL PRIMARY KEY,
  nome_ingrediente VARCHAR(50) NOT NULL,
  descricao_ingrediente VARCHAR(255)
);

-- =======================
-- Relacionamento doce x ingrediente (N:N)
-- =======================
CREATE TABLE doce_has_ingrediente (
  doce_id_doce INTEGER NOT NULL,
  ingrediente_id_ingrediente INTEGER NOT NULL,
  PRIMARY KEY (doce_id_doce, ingrediente_id_ingrediente),
  CONSTRAINT fk_doce_ingrediente_doce FOREIGN KEY (doce_id_doce)
    REFERENCES doce (id_doce)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_doce_ingrediente_ingrediente FOREIGN KEY (ingrediente_id_ingrediente)
    REFERENCES ingrediente (id_ingrediente)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================
-- Tabela pedido
-- =======================
CREATE TABLE pedido (
  id_pedido SERIAL PRIMARY KEY,
  cliente_pessoa_id_pessoa INTEGER NOT NULL,
  data_pedido TIMESTAMP NOT NULL DEFAULT NOW(),
  status_pedido VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  valor_total NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_pessoa_id_pessoa)
    REFERENCES cliente (pessoa_id_pessoa)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================
-- Relacionamento pedido x doce (N:N)
-- =======================
CREATE TABLE pedido_has_doce (
  pedido_id_pedido INTEGER NOT NULL,
  doce_id_doce INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (pedido_id_pedido, doce_id_doce),
  CONSTRAINT fk_pedido_doce_pedido FOREIGN KEY (pedido_id_pedido)
    REFERENCES pedido (id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pedido_doce_doce FOREIGN KEY (doce_id_doce)
    REFERENCES doce (id_doce)
    ON DELETE CASCADE ON UPDATE CASCADE
);

