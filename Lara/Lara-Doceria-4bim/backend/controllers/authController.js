const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'segredo_super_seguro'; // use variável de ambiente depois

// =====================================================
// GERAR TOKEN (INCLUINDO CARGO)
// =====================================================
function gerarToken(user) {
  return jwt.sign(
    {
      id: user.id_pessoa,
      email: user.email_pessoa,
      cargo: user.cargo,
    },
    SECRET,
    { expiresIn: '2h' }
  );
}

// =====================================================
// VERIFY TOKEN (USANDO COOKIE)
// =====================================================
exports.verifyToken = (req, res, next) => {
    // Suporta token em vários lugares: Authorization Bearer, cookie, x-access-token ou query string
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // Aceita também token bruto no header Authorization
        token = authHeader;
      }
    }
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];
    if (!token && req.query && req.query.token) token = req.query.token;
    // Normalizar token
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    if (typeof token === 'string') token = token.trim();
    // Rejeitar palavras literais e tokens claramente inválidos
    if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
      return res.status(401).json({ message: 'Token inválido ou não fornecido' });
    }
    // JWTs possuem duas "." separadoras -> 3 partes
    if (typeof token === 'string' && token.split('.').length !== 3) {
      return res.status(401).json({ message: 'Token malformado' });
    }

    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error('verifyToken error:', err && err.message ? err.message : err);
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};

// =====================================================
// CADASTRAR USUÁRIO
// =====================================================
exports.registerUser = async (req, res) => {
  try {
    const { nome, email, senha, telefone, data_nascimento, endereco } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const pessoaResult = await db.query(
      `INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, data_nascimento)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_pessoa`,
      [nome, email, senhaHash, telefone, data_nascimento]
    );

    const idPessoa = pessoaResult.rows[0].id_pessoa;

    // padrão: vira cliente
    await db.query(
      `INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES ($1, $2)`,
      [idPessoa, endereco]
    );

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

// =====================================================
// LOGIN
// =====================================================
exports.loginUser = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // buscar pessoa
    const result = await db.query(
      'SELECT * FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Usuário não encontrado' });

    const user = result.rows[0];

    // validar senha
    let senhaValida = await bcrypt.compare(senha, user.senha_pessoa);

    if (!senhaValida && senha === user.senha_pessoa) {
      senhaValida = true; // fallback
    }

    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // =====================================================
    // DESCOBRIR O CARGO DO USUÁRIO
    // =====================================================
    let cargo = "cliente";

    const gerente = await db.query(
      'SELECT * FROM gerente WHERE pessoa_id_pessoa = $1',
      [user.id_pessoa]
    );

    if (gerente.rows.length > 0)
      cargo = "gerente";

    const funcionario = await db.query(
      'SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1',
      [user.id_pessoa]
    );

    if (funcionario.rows.length > 0)
      cargo = "funcionario";

    user.cargo = cargo;

    // gerar token
    const token = gerarToken(user);

    // enviar no cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000, // 2 horas
    });

    res.json({
      message: 'Login bem-sucedido',
      token,
      cargo,
      user: {
        id: user.id_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login' });
  }
};

// =====================================================
// PERFIL DO USUÁRIO (APENAS EXEMPLO)
// =====================================================
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await db.query(
      'SELECT id_pessoa, nome_pessoa, email_pessoa, telefone_pessoa, data_nascimento FROM pessoa WHERE id_pessoa = $1',
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

// =====================================================
// VERIFICAR SE É GERENTE
// =====================================================
exports.verificarGerente = async (req, res, next) => {
  try {
    if (req.user.cargo !== 'gerente') {
      return res.status(403).json({
        message: 'Acesso negado. Apenas gerentes podem acessar.'
      });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao verificar permissões' });
  }
};
 
// Rota leve para o frontend verificar se o usuário logado é gerente
// Esta rota NÃO devolve 401: sempre retorna { isGerente: boolean }
exports.isGerente = async (req, res) => {
  try {
    // Tenta extrair o token de header/cookie/x-access-token/query (mesma lógica do verifyToken)
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      if (authHeader.toLowerCase().startsWith('bearer ')) token = authHeader.split(' ')[1];
      else token = authHeader;
    }
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];
    if (!token && req.query && req.query.token) token = req.query.token;

    if (!token) return res.json({ isGerente: false });

    if (typeof token === 'string') token = token.trim();
    if (!token || token === 'undefined' || token === 'null' || token.split('.').length !== 3) {
      return res.json({ isGerente: false });
    }

    try {
      const decoded = jwt.verify(token, SECRET);
      const id = decoded.id;
      const result = await db.query('SELECT pessoa_id_pessoa FROM gerente WHERE pessoa_id_pessoa = $1', [id]);
      const isGerente = result.rows.length > 0;
      return res.json({ isGerente });
    } catch (err) {
      // Token inválido/expirado → não autorizado como gerente
      return res.json({ isGerente: false });
    }
  } catch (err) {
    console.error('Erro isGerente:', err);
    return res.json({ isGerente: false, error: 'Erro interno' });
  }
};

// =====================================================
// /ME → RETORNA DADOS DO USUÁRIO LOGADO
// =====================================================
exports.me = (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.json({ logado: false });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const id = decoded.id;

    // Buscar nome do usuário no banco para retornar ao frontend
    try {
      const result = db.query('SELECT nome_pessoa, email_pessoa FROM pessoa WHERE id_pessoa = $1', [id]);
      return result.then(r => {
        if (r.rows.length === 0) return res.json({ logado: false });
        const row = r.rows[0];
        return res.json({
          logado: true,
          id: id,
          nome: row.nome_pessoa,
          email: row.email_pessoa,
          cargo: decoded.cargo
        });
      }).catch(err => {
        console.error('Erro ao buscar nome em /me:', err);
        return res.json({ logado: false });
      });
    } catch (err) {
      console.error('Erro interno /me:', err);
      return res.json({ logado: false });
    }

  } catch (err) {
    return res.json({ logado: false });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout realizado!" });
};
