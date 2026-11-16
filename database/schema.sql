-- WS Gestão
-- Modelo físico (SQLite) baseado no Modelo Entidade-Relacionamento da documentação (cap. 6)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario   TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  senha_hash   TEXT NOT NULL,               -- PBKDF2-SHA256 com salt (RNF03)
  perfil       TEXT NOT NULL CHECK (perfil IN ('administrador','assistente')),
  ativo        INTEGER NOT NULL DEFAULT 1,
  pedido_senha INTEGER NOT NULL DEFAULT 0      -- pediu nova senha na tela de login
);

CREATE TABLE IF NOT EXISTS coluna (
  id_coluna    TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  ordem        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS servico (
  id_servico   TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  descricao    TEXT,
  nicho        INTEGER NOT NULL CHECK (nicho BETWEEN 1 AND 4)  -- 1 assessoria, 2 imóveis, 3 despachante, 4 seguros (RN05)
);

CREATE TABLE IF NOT EXISTS cliente (
  id_cliente        TEXT PRIMARY KEY,
  id_coluna         TEXT REFERENCES coluna(id_coluna),
  tipo_pessoa       TEXT NOT NULL CHECK (tipo_pessoa IN ('F','J')),
  nome              TEXT NOT NULL,
  cpf_cnpj          TEXT,
  telefone          TEXT,
  email             TEXT,
  origem            TEXT,
  indicado_por      TEXT,
  ativo             INTEGER NOT NULL DEFAULT 1,
  posicao_na_coluna INTEGER NOT NULL DEFAULT 0,
  criado_em         TEXT,
  token_portal      TEXT UNIQUE,        -- link de acompanhamento do próprio cliente
  CHECK (COALESCE(telefone,'') <> '' OR COALESCE(email,'') <> '')      -- RN01
);

CREATE TABLE IF NOT EXISTS servico_contratado (
  id_contratacao           TEXT PRIMARY KEY,
  id_cliente               TEXT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  id_servico               TEXT NOT NULL REFERENCES servico(id_servico),
  valor_combinado          REAL NOT NULL CHECK (valor_combinado > 0),   -- RN04
  status                   TEXT NOT NULL CHECK (status IN ('andamento','finalizado')),  -- RN07
  prazo                    TEXT,
  data_assinatura_contrato TEXT,   -- só imóveis (RN08)
  data_entrega_chaves      TEXT,   -- só imóveis (RN08)
  data_renovacao           TEXT,   -- só seguros (RN09)
  criado_em                TEXT
);

CREATE TABLE IF NOT EXISTS parcela (
  id_parcela     TEXT PRIMARY KEY,
  id_contratacao TEXT NOT NULL REFERENCES servico_contratado(id_contratacao) ON DELETE CASCADE,
  numero         INTEGER NOT NULL,
  valor          REAL NOT NULL,
  vencimento     TEXT NOT NULL,
  situacao       TEXT NOT NULL CHECK (situacao IN ('paga','pendente')),
  data_pagamento TEXT
);

CREATE TABLE IF NOT EXISTS checklist_item (
  id_item        TEXT PRIMARY KEY,
  id_contratacao TEXT NOT NULL REFERENCES servico_contratado(id_contratacao) ON DELETE CASCADE,
  descricao      TEXT NOT NULL,
  concluido      INTEGER NOT NULL DEFAULT 0,
  ordem          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comentario (
  id_comentario TEXT PRIMARY KEY,
  id_cliente    TEXT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  usuario       TEXT,
  texto         TEXT NOT NULL,
  data_hora     TEXT,
  publico       INTEGER NOT NULL DEFAULT 0   -- 1 = aparece no portal do cliente
);

CREATE TABLE IF NOT EXISTS anexo (
  id_anexo     TEXT PRIMARY KEY,
  id_cliente   TEXT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  conteudo     TEXT NOT NULL,   -- versões antigas: arquivo em base64; hoje fica vazio
  arquivo      TEXT,            -- nome do arquivo salvo em database/anexos/
  enviado_em   TEXT
);

CREATE TABLE IF NOT EXISTS lembrete (
  id_lembrete TEXT PRIMARY KEY,
  id_cliente  TEXT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,     -- prazo, retorno, tarefa (parcela e renovação são calculados)
  descricao   TEXT NOT NULL,
  data_hora   TEXT,
  concluido   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historico (
  id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente   TEXT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
  texto        TEXT NOT NULL,
  usuario      TEXT,
  data_hora    TEXT
);

CREATE TABLE IF NOT EXISTS configuracao (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS sessao (
  token       TEXT PRIMARY KEY,
  id_usuario  TEXT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  criada_em   TEXT NOT NULL DEFAULT (datetime('now'))
);
