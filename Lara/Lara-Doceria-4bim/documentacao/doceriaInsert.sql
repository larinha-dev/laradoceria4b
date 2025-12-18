-- =======================
-- INSERTS EXEMPLO
-- =======================

-- Pessoas
INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, data_nascimento) VALUES
('Maria Doceira', 'maria@email.com', 'senha123', '11999990000', '1990-06-12'),
('João Cliente', 'joao@email.com', 'senha234', '11988887777', '1995-04-21'),
('Carla Gestora', 'carla@email.com', 'senha345', '11977776666', '1987-02-10');

-- Clientes
INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES
(2, 'Rua das Rosas, 45');

-- Funcionário
INSERT INTO funcionario (pessoa_id_pessoa, cargo_funcionario, salario_funcionario) VALUES
(1, 'Confeiteira', 2500.00);

-- Gerente
INSERT INTO gerente (pessoa_id_pessoa) VALUES
(3);

-- Ingredientes
INSERT INTO ingrediente (nome_ingrediente, descricao_ingrediente) VALUES
('Chocolate', 'Chocolate ao leite de alta qualidade'),
('Leite Condensado', 'Usado para brigadeiros e coberturas'),
('Morango', 'Fruta fresca para recheios e coberturas');

-- Doces
INSERT INTO doce (nome_doce, descricao_doce, preco_doce) VALUES
('Brigadeiro Gourmet', 'Brigadeiro feito com chocolate belga', 3.50),
('Bolo de Morango', 'Bolo recheado com chantilly e morangos frescos', 25.00);

-- Relacionamento doce x ingrediente
INSERT INTO doce_has_ingrediente (doce_id_doce, ingrediente_id_ingrediente) VALUES
(1, 1), -- Chocolate
(1, 2), -- Leite condensado
(2, 3), -- Morango
(2, 2); -- Leite condensado

-- Pedido
INSERT INTO pedido (cliente_pessoa_id_pessoa, valor_total) VALUES
(2, 32.00);

-- Pedido x Doce
INSERT INTO pedido_has_doce (pedido_id_pedido, doce_id_doce, quantidade) VALUES
(1, 1, 2),
(1, 2, 1);
-- =======================
-- Usuário Gerente Mestre (ID 28)
-- =======================
INSERT INTO pessoa (id_pessoa, nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, primeiro_acesso_pessoa) 
VALUES (28, 'Gerente Mestre', 'gerente.mestre@doceria.com', '$2a$10$K.vVLq/yzB3xH8z7K.vVL.K.vVLq/yzB3xH8z7K.vVLq/yzB3xH8z7', '+5544999074747', false);

INSERT INTO gerente (pessoa_id_pessoa) 
VALUES (28);