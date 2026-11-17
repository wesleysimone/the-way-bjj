-- THE WAY — banco MySQL das sugestões e relatórios de teste
-- Rode no MySQL Workbench (File > Open SQL Script > raio ⚡) ou no phpMyAdmin da hospedagem (aba SQL).
-- Opcional: a api.php também cria as tabelas sozinha na primeira chamada.
-- Os códigos de acesso ficam no servidor/config.php (não no banco).

CREATE DATABASE IF NOT EXISTS theway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE theway;   -- na hospedagem, apague esta linha e escolha o banco na tela

CREATE TABLE IF NOT EXISTS tw_sugestoes (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  solicitante    VARCHAR(80)  NOT NULL,
  criado_em      DATETIME     NOT NULL,             -- UTC
  atualizado_em  DATETIME     NOT NULL,
  area           VARCHAR(80)  NOT NULL DEFAULT 'Geral',
  tela           VARCHAR(255) NOT NULL DEFAULT '',
  onde           LONGTEXT     NULL,                 -- JSON: ponto marcado na tela
  descricao      TEXT         NOT NULL,
  observacoes    TEXT         NULL,
  situacao       VARCHAR(40)  NOT NULL DEFAULT 'Pendente',
  enviada_em     DATETIME     NULL,
  enviada_por    VARCHAR(80)  NULL,
  aprovada_em    DATETIME     NULL,
  aprovada_por   VARCHAR(80)  NULL,
  apoios         LONGTEXT     NULL,                 -- JSON: ["Nome", ...] quem disse "é a mesma"
  afeta_aprovada BIGINT       NULL,                 -- nº da aprovada que esta sugestão mexe
  historico      LONGTEXT     NULL                  -- JSON: [{em, por, de, para, nota}, ...]
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tw_testes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  criado_em   DATETIME    NOT NULL,
  responsavel VARCHAR(80) NOT NULL,
  tipo        VARCHAR(20) NOT NULL,                 -- 'automatico' ou 'manual'
  resumo      TEXT        NULL,                     -- JSON
  relatorio   LONGTEXT    NULL                      -- JSON completo
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultas úteis no Workbench:
-- SELECT id, solicitante, situacao, descricao FROM tw_sugestoes ORDER BY id;
-- SELECT id, criado_em, responsavel, tipo FROM tw_testes ORDER BY id DESC;
