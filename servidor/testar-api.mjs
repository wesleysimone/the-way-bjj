/* Teste automático da API (servidor/api.php) sem instalar PHP nem MySQL:
 * roda o PHP de verdade dentro do Node (php-wasm) com um banco SQLite temporário.
 *
 *   npm i @php-wasm/node @php-wasm/universal
 *   node servidor/testar-api.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime } from '@php-wasm/node';

const aqui = dirname(fileURLToPath(import.meta.url));
const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: 1 } }));
php.mkdir('/www');
php.writeFile('/www/api.php', readFileSync(join(aqui, 'api.php'), 'utf8'));
php.writeFile('/www/config.php', `<?php return ['dsn' => 'sqlite:/www/teste.db', 'codigo_equipe' => 'EQ', 'codigo_admin' => 'ADM', 'origens' => ['*']];`);

async function chamar(fn, params) {
  const r = await php.run({ method: 'POST', url: '/api.php', headers: { 'Content-Type': 'application/json' }, body: new TextEncoder().encode(JSON.stringify({ fn, params })), scriptPath: '/www/api.php' });
  try { return JSON.parse(r.text); } catch (e) { return { ok: false, erro: 'RESPOSTA: ' + r.text }; }
}
let ok = 0, falhas = 0;
function conf(nome, cond, extra) { if (cond) { ok++; console.log('✅', nome); } else { falhas++; console.log('❌', nome, extra !== undefined ? JSON.stringify(extra) : ''); } }
const dados = async (fn, p) => { const r = await chamar(fn, p); if (!r.ok) throw new Error(fn + ': ' + r.erro); return r.dados; };
const erro = async (fn, p) => { const r = await chamar(fn, p); return r.ok ? null : r.erro; };

conf('código errado é recusado', (await erro('tw_verificar', { p_codigo: 'x' })) === 'Código de acesso inválido');
conf('sem código não lista', !!(await erro('tw_sug_listar', {})));
conf('código da equipe = equipe', (await dados('tw_verificar', { p_codigo: 'EQ' })) === 'equipe');
conf('código do admin = admin', (await dados('tw_verificar', { p_codigo: 'ADM' })) === 'admin');

const s1 = await dados('tw_sug_criar', { p_codigo: 'EQ', p_solicitante: ' Ana ', p_descricao: 'Botão maior no Pix', p_area: 'App do aluno', p_tela: 'Pagamentos', p_onde: { seletor: '#simpag', hash: '#/app/pagamentos' } });
conf('cria sugestão nº 1', s1.id === 1 && s1.situacao === 'Pendente' && s1.solicitante === 'Ana', s1);
conf('guarda o ponto marcado (JSON)', s1.onde && s1.onde.seletor === '#simpag');
conf('histórico começa com "Criada"', s1.historico.length === 1 && s1.historico[0].nota === 'Criada');
conf('datas no formato ISO', /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s1.criado_em), s1.criado_em);
conf('acentos preservados', s1.area === 'App do aluno' && (await dados('tw_sug_criar', { p_codigo: 'EQ', p_solicitante: 'João', p_descricao: 'Graduação ção ã é' })).descricao === 'Graduação ção ã é');
conf('descrição vazia é recusada', (await erro('tw_sug_criar', { p_codigo: 'EQ', p_solicitante: 'Ana', p_descricao: ' ' })) === 'Descreva a sugestão');
conf('área vazia vira Geral', (await dados('tw_sug_criar', { p_codigo: 'EQ', p_solicitante: 'Bia', p_descricao: 'Mudar cor', p_area: '' })).area === 'Geral');

conf('outra pessoa não edita', /Só Ana/.test(await erro('tw_sug_editar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Bia', p_descricao: 'hack' })));
const ed = await dados('tw_sug_editar', { p_codigo: 'EQ', p_id: 1, p_nome: 'ana', p_descricao: 'Botão maior no Pix (verde)', p_observacoes: 'urgente' });
conf('quem cadastrou edita (sem diferenciar maiúscula)', ed.descricao === 'Botão maior no Pix (verde)' && ed.observacoes === 'urgente');
conf('admin edita de qualquer um', (await dados('tw_sug_editar', { p_codigo: 'ADM', p_id: 1, p_nome: 'Wesley', p_area: 'Pix' })).area === 'Pix');

let ap = await dados('tw_sug_apoiar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Bia' });
ap = await dados('tw_sug_apoiar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Bia' });
ap = await dados('tw_sug_apoiar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Ana' });
conf('apoio conta 1 vez e não conta o próprio autor', ap.apoios.length === 1 && ap.apoios[0] === 'Bia', ap.apoios);

conf('enviar envia só as minhas pendentes', (await dados('tw_sug_enviar', { p_codigo: 'EQ', p_nome: 'Ana' })) === 1);
const lista = await dados('tw_sug_listar', { p_codigo: 'EQ' });
const a1 = lista.find((s) => s.id === 1);
conf('enviada guarda quem e quando', a1.situacao === 'Enviada' && a1.enviada_por === 'Ana' && !!a1.enviada_em);
conf('as dos outros continuam pendentes', lista.find((s) => s.id === 3).situacao === 'Pendente');
conf('enviar de novo não duplica', (await dados('tw_sug_enviar', { p_codigo: 'EQ', p_nome: 'Ana' })) === 0);

conf('equipe não muda situação', (await erro('tw_sug_status', { p_codigo: 'EQ', p_id: 1, p_situacao: 'Em análise' })) === 'Somente o administrador pode fazer isso');
conf('situação inválida é recusada', /Situação inválida/.test(await erro('tw_sug_status', { p_codigo: 'ADM', p_id: 1, p_situacao: 'Feito' })));
conf('admin muda para Em análise', (await dados('tw_sug_status', { p_codigo: 'ADM', p_id: 1, p_situacao: 'Em análise', p_nota: 'vendo', p_por: 'Wesley' })).situacao === 'Em análise');
conf('aprovar antes da hora é recusado', /não está aguardando/.test(await erro('tw_sug_aprovar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Ana', p_aprovado: true })));
const re = await dados('tw_sug_status', { p_codigo: 'ADM', p_id: 1, p_situacao: 'Realizada', p_por: 'Wesley' });
conf('Realizada vira Aguardando aprovação', re.situacao === 'Aguardando aprovação');
conf('pedir ajuste exige explicação', (await erro('tw_sug_aprovar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Ana', p_aprovado: false, p_nota: '' })) === 'Explique o que ainda precisa ajustar');
const aj = await dados('tw_sug_aprovar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Ana', p_aprovado: false, p_nota: 'falta o verde' });
conf('pedir ajuste → Reprovada — necessita de ajuste', aj.situacao === 'Reprovada — necessita de ajuste' && aj.aprovada_por === null);
await dados('tw_sug_status', { p_codigo: 'ADM', p_id: 1, p_situacao: 'Realizada', p_por: 'Wesley' });
const ok1 = await dados('tw_sug_aprovar', { p_codigo: 'EQ', p_id: 1, p_nome: 'Ana', p_aprovado: true });
conf('aprovar guarda quem e quando', ok1.situacao === 'Aprovada' && ok1.aprovada_por === 'Ana' && !!ok1.aprovada_em);
conf('histórico completo', ok1.historico.map((h) => h.para).join(' > ') === 'Pendente > Enviada > Em análise > Realizada > Aguardando aprovação > Reprovada — necessita de ajuste > Realizada > Aguardando aprovação > Aprovada', ok1.historico.map((h) => h.para));
conf('aprovada fica travada (nem o admin edita)', /travada/.test(await erro('tw_sug_editar', { p_codigo: 'ADM', p_id: 1, p_nome: 'Wesley', p_descricao: 'mudar' })));
conf('nova sugestão marca que mexe na aprovada', (await dados('tw_sug_criar', { p_codigo: 'EQ', p_solicitante: 'Caio', p_descricao: 'Trocar o Pix', p_afeta: 1 })).afeta_aprovada === 1);

conf('equipe não exclui', !!(await erro('tw_sug_excluir', { p_codigo: 'EQ', p_id: 3 })));
conf('admin exclui', (await dados('tw_sug_excluir', { p_codigo: 'ADM', p_id: 3 })) === true);
conf('sugestão que não existe', (await erro('tw_sug_editar', { p_codigo: 'ADM', p_id: 99, p_nome: 'W', p_descricao: 'x' })) === 'Sugestão 99 não existe');

const tid = await dados('tw_teste_salvar', { p_codigo: 'EQ', p_responsavel: 'Bia', p_tipo: 'automatico', p_resumo: { ok: 28, erros: 0 }, p_relatorio: { casos: [{ nome: 'Pix', ok: true }] } });
const tl = await dados('tw_teste_listar', { p_codigo: 'EQ' });
conf('relatório salvo e listado (sem o conteúdo pesado)', tid === 1 && tl.length === 1 && tl[0].resumo.ok === 28 && tl[0].relatorio === undefined);
conf('relatório completo é obtido', (await dados('tw_teste_obter', { p_codigo: 'EQ', p_id: 1 })).casos[0].nome === 'Pix');
conf('relatório pede código', !!(await erro('tw_teste_listar', { p_codigo: 'x' })));
conf('função desconhecida', /desconhecida/.test(await erro('tw_apagar_tudo', { p_codigo: 'ADM' })));

const get = await php.run({ method: 'GET', url: '/api.php', scriptPath: '/www/api.php' });
conf('GET mostra que a API está no ar', JSON.parse(get.text).ok === true);
const opt = await php.run({ method: 'OPTIONS', url: '/api.php', scriptPath: '/www/api.php' });
conf('CORS liberado para o site', opt.httpStatusCode === 204 && /\*/.test(opt.headers['access-control-allow-origin'] || ''), opt.headers);

console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
