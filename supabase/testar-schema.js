// Como rodar: npm i @electric-sql/pglite@0.2.17  e depois  node supabase/testar-schema.js supabase/schema.sql
// Valida o schema.sql do Supabase num Postgres embutido (PGlite), simulando o papel "anon" do site.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const sql = fs.readFileSync(process.argv[2], 'utf8');
let ok = 0, falhas = 0;
const t = async (nome, fn, esperaErro) => {
  try { const r = await fn(); if (esperaErro) { falhas++; console.log('❌', nome, '— deveria dar erro'); } else { ok++; console.log('✅', nome, r === undefined ? '' : JSON.stringify(r).slice(0, 140)); } }
  catch (e) { if (esperaErro && (!esperaErro.test || esperaErro.test(e.message))) { ok++; console.log('✅', nome, '→ bloqueado:', e.message.slice(0, 90)); } else { falhas++; console.log('❌', nome, e.message); } }
};
(async () => {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;`);
  await db.exec(sql);
  await db.exec(`update tw_priv.config set valor='EQ' where chave='codigo_equipe'; update tw_priv.config set valor='ADM' where chave='codigo_admin';`);
  const anon = async (q, p = []) => { await db.exec('set role anon'); try { return (await db.query(q, p)).rows; } finally { await db.exec('reset role'); } };
  const f = (nome, args) => anon(`select * from ${nome}(${args.map((_, i) => '$' + (i + 1)).join(',')})`, args);

  await t('anon NÃO lê a tabela direto', () => anon('select * from tw_sugestoes'), /permission denied/);
  await t('anon NÃO lê os códigos', () => anon('select * from tw_priv.config'), /permission denied/);
  await t('código errado é recusado', () => f('tw_sug_listar', ['xx']), /inválido/);
  await t('verificar equipe', async () => (await f('tw_verificar', ['EQ']))[0]);
  await t('verificar admin', async () => (await f('tw_verificar', ['ADM']))[0]);
  await t('criar sugestão 1 (Ana)', async () => (await f('tw_sug_criar', ['EQ', 'Ana', 'Incluir horário terça 7h', 'Site › Horários', 'Site', JSON.stringify({ onde: 'Horários › Terça' }), '', null]))[0].id);
  await t('criar sugestão 2 (Beto)', async () => (await f('tw_sug_criar', ['EQ', 'Beto', 'Mudar cor do botão', 'App', 'App do aluno', null, 'obs', null]))[0].situacao);
  await t('descrição vazia recusada', () => f('tw_sug_criar', ['EQ', 'Ana', '', 'x', '', null, '', null]), /violates check|descricao/);
  await t('Beto apoia a 1 (evita duplicar)', async () => (await f('tw_sug_apoiar', ['EQ', 1, 'Beto']))[0].apoios);
  await t('apoio repetido não duplica', async () => (await f('tw_sug_apoiar', ['EQ', 1, 'Beto']))[0].apoios);
  await t('Beto NÃO edita a da Ana', () => f('tw_sug_editar', ['EQ', 1, 'Beto', 'hack', null, null]), /Só Ana/);
  await t('Ana edita a dela', async () => (await f('tw_sug_editar', ['EQ', 1, 'ana', 'Incluir horário terça às 7h e 8h', null, null]))[0].descricao);
  await t('Ana envia as pendentes dela', async () => (await f('tw_sug_enviar', ['EQ', 'Ana']))[0]);
  await t('equipe NÃO muda situação', () => f('tw_sug_status', ['EQ', 1, 'Em análise', '', 'x']), /administrador/);
  await t('situação inválida recusada', () => f('tw_sug_status', ['ADM', 1, 'Qualquer', '', 'Wesley']), /inválida/);
  await t('admin: Em análise', async () => (await f('tw_sug_status', ['ADM', 1, 'Em análise', '', 'Wesley']))[0].situacao);
  await t('admin: Realizada → Aguardando aprovação', async () => (await f('tw_sug_status', ['ADM', 1, 'Realizada', 'feito', 'Wesley']))[0].situacao);
  await t('reprovar sem explicar é recusado', () => f('tw_sug_aprovar', ['EQ', 1, 'Ana', false, '']), /Explique/);
  await t('Ana reprova com nota', async () => (await f('tw_sug_aprovar', ['EQ', 1, 'Ana', false, 'faltou o de 8h']))[0].situacao);
  await t('aprovar fora de hora é recusado', () => f('tw_sug_aprovar', ['EQ', 1, 'Ana', true, '']), /não está aguardando/);
  await t('admin: Realizada de novo', async () => (await f('tw_sug_status', ['ADM', 1, 'Realizada', '', 'Wesley']))[0].situacao);
  await t('Ana aprova', async () => { const r = (await f('tw_sug_aprovar', ['EQ', 1, 'Ana', true, 'ok']))[0]; return [r.situacao, r.aprovada_por, r.historico.length]; });
  await t('aprovada fica travada para edição', () => f('tw_sug_editar', ['ADM', 1, 'Wesley', 'mudar', null, null]), /travada/);
  await t('listar (equipe)', async () => (await f('tw_sug_listar', ['EQ'])).map((r) => `${r.id}:${r.situacao}`));
  await t('salvar relatório de teste', async () => (await f('tw_teste_salvar', ['EQ', 'Ana', 'manual', JSON.stringify({ erros: 1 }), JSON.stringify({ itens: [1, 2] })]))[0]);
  await t('tipo de teste inválido recusado', () => f('tw_teste_salvar', ['EQ', 'Ana', 'xx', '{}', '{}']), /violates check|tipo/);
  await t('listar relatórios', async () => (await f('tw_teste_listar', ['EQ'])).length);
  await t('obter relatório', async () => (await f('tw_teste_obter', ['EQ', 1]))[0]);
  await t('equipe NÃO exclui', () => f('tw_sug_excluir', ['EQ', 2]), /administrador/);
  await t('admin exclui', async () => (await f('tw_sug_excluir', ['ADM', 2]))[0]);
  await t('rodar o schema 2x não quebra', () => db.exec(sql));
  console.log(`\n${ok} ok, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})();
