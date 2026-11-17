/* Central de TESTES (para pessoas sem conhecimento técnico).
 *
 * ▶️ Teste automático: o sistema usa as telas sozinho, mostrando cada passo (destaque amarelo),
 *    confere se deu certo e gera um relatório. Roda numa "caixa de areia": antes de começar guarda
 *    todos os dados deste aparelho e no fim devolve tudo como estava (não cria sugestões nem fotos).
 * 🔴 Teste manual acompanhado: "Iniciar teste" → a pessoa usa o sistema normalmente; registramos
 *    telas, botões, ações concluídas e erros. "Anotar problema" a qualquer momento. No fim, relatório.
 * Relatórios: salvos na base da equipe (compartilhada quando configurada) e enviáveis pelo WhatsApp.
 */
window.Testes = (function () {
  const { store, esc, toast, modal, $, $$ } = App;
  const dh = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const dur = (s) => s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`;

  // =====================================================================
  // CENTRAL
  // =====================================================================
  async function abrir() {
    const e = await Equipe.identificar();
    const ativo = store.get('teste-ativo', null);
    modal(`
      <h3>🧪 Central de testes</h3>
      <p class="a-muted" style="margin-top:0">Olá, <b>${esc(e.nome)}</b>! Escolha como quer testar. Não precisa saber nada de programação.</p>

      <div class="t-card">
        <div class="t-ic">▶️</div>
        <div style="flex:1"><b>Teste automático</b>
          <p>O sistema testa sozinho cerca de 30 funções (site, app do aluno, painel, Pix, agenda, aula experimental…) e <b>mostra cada passo na tela</b>. Leva uns 2 minutos. <b>Não altera seus dados.</b></p>
          <label class="t-opc"><input type="checkbox" id="t-facial"> Incluir reconhecimento facial (baixa ~13 MB, +1 min)</label>
          <button class="btn btn-primary btn-block" id="t-auto">Iniciar teste automático</button></div>
      </div>

      <div class="t-card">
        <div class="t-ic">🔴</div>
        <div style="flex:1"><b>Teste manual acompanhado</b>
          <p>Toque em <b>Iniciar teste</b> e use o sistema normalmente. Vamos anotando sozinhos as telas, os botões e qualquer erro. Se algo estiver estranho, toque em <b>📝 Anotar problema</b>. No fim, <b>Finalizar</b> gera o relatório.</p>
          ${ativo ? `<p style="color:#B42323"><b>Há um teste em andamento</b> desde ${dh(ativo.inicio)}.</p>
            <div class="a-row" style="gap:8px"><button class="btn btn-ghost" style="flex:1" data-close>Continuar testando</button><button class="btn btn-primary" style="flex:1" id="t-fim">Finalizar agora</button></div>`
            : `<button class="btn btn-primary btn-block" id="t-manual">🔴 Iniciar teste</button>`}</div>
      </div>

      <div class="t-card">
        <div class="t-ic">📄</div>
        <div style="flex:1"><b>Relatórios de teste</b>
          <p>Todos os testes já feitos ${Equipe.compartilhado ? 'pela equipe' : 'neste aparelho'}, com quem testou, quando, o que funcionou e os erros.</p>
          <div id="t-lista" class="t-lista"><small class="a-muted">Carregando…</small></div></div>
      </div>

      <details class="t-dados"><summary>🧹 Dados de demonstração deste aparelho</summary>
        <div id="t-dados"></div>
        <button class="btn btn-ghost btn-block btn-sm" id="t-zerar" style="margin-top:8px">Zerar demonstração (mantém sugestões e relatórios)</button>
      </details>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:10px;border-color:transparent">Fechar</button>
    `, async (m, fechar) => {
      const a = $('#t-auto', m); if (a) a.onclick = () => { const f = $('#t-facial', m).checked; fechar(); rodarAutomatico({ facial: f }); };
      const mn = $('#t-manual', m); if (mn) mn.onclick = () => { fechar(); iniciarManual(); };
      const fi = $('#t-fim', m); if (fi) fi.onclick = () => { fechar(); finalizarManual(); };
      $('#t-zerar', m).onclick = async () => {
        if (!(await App.confirmar('Apagar os dados de demonstração deste aparelho (agendamentos, pagamentos simulados, experimentais, rostos e fotos)?', 'Apagar'))) return;
        ['agendados', 'pagos', 'checkinHoje', 'aulasExtras', 'experimentais', 'rostos', 'presencas', 'faltas', 'mostrarPrecos'].forEach((k) => { try { localStorage.removeItem('tw:' + k); } catch (e) { } });
        if (window.Galeria) await Galeria.limpar().catch(() => {});
        fechar(); App.render(); toast('Demonstração zerada ✓');
      };
      // dados
      const fotos = window.Galeria ? await Galeria.contar() : 0;
      $('#t-dados', m).innerHTML = [['Aulas experimentais (teste)', store.get('experimentais', []).length], ['Rostos cadastrados', window.Rosto ? Rosto.cadastrados().length : 0], ['Fotos da turma no histórico', fotos], ['Aulas agendadas no app', store.get('agendados', []).length], ['Mensalidades pagas (simulação)', store.get('pagos', []).length]]
        .map(([n, v]) => `<div class="pay-row" style="padding:6px 0"><span>${n}</span><b>${v}</b></div>`).join('') + `<p class="a-muted" style="font-size:12px">Ficam salvos neste aparelho. ${App.aparelho()}</p>`;
      // relatórios
      try {
        const l = await Equipe.chamar('tw_teste_listar');
        $('#t-lista', m).innerHTML = l.length ? l.slice(0, 15).map((r) => `<button class="t-rel" data-rel="${r.id}">
          <span>${r.tipo === 'automatico' ? '▶️' : '🔴'} <b>${esc(r.responsavel)}</b> · ${dh(r.criado_em)}</span>
          <span>${r.resumo.falhas ? `<b style="color:#B42323">❌ ${r.resumo.falhas}</b>` : '<b style="color:#1d7a4c">✅ sem falhas</b>'} · ${r.resumo.ok || 0} ok</span></button>`).join('') : '<small class="a-muted">Nenhum relatório ainda.</small>';
        $$('[data-rel]', m).forEach((b) => b.onclick = async () => { const rel = await Equipe.chamar('tw_teste_obter', { p_id: +b.dataset.rel }); if (rel) { fechar(); mostrarRelatorio(rel, { salvo: true }); } });
      } catch (e) { $('#t-lista', m).innerHTML = `<small style="color:#B42323">${esc(e.message)}</small>`; }
    });
  }

  // =====================================================================
  // TESTE AUTOMÁTICO
  // =====================================================================
  let rodando = false, parar = false, painel = null;

  function painelAuto(casos) {
    painel = document.createElement('div'); painel.id = 'teste-auto'; painel.className = 'teste-auto';
    painel.innerHTML = `<div class="ta-top"><b>▶️ Teste automático</b><span id="ta-cont">0/${casos.length}</span><button id="ta-parar">Parar</button></div>
      <div class="progress" style="background:#e3e8ec;height:6px"><div id="ta-barra" style="width:0;background:var(--blue)"></div></div>
      <div class="ta-agora" id="ta-agora">Preparando…</div>
      <ol class="ta-lista" id="ta-lista">${casos.map((c, i) => `<li id="ta-${i}"><span class="ta-st">⏳</span><span><small>${esc(c.modulo)}</small>${esc(c.nome)}</span></li>`).join('')}</ol>`;
    document.body.appendChild(painel);
    $('#ta-parar').onclick = () => { parar = true; $('#ta-parar').textContent = 'Parando…'; };
  }

  // ajudantes usados pelos casos de teste
  function ajudantes(caso) {
    const passo = (txt) => { caso.passos.push(txt); const a = $('#ta-agora'); if (a) a.innerHTML = `<b>${esc(caso.nome)}</b><br>${esc(txt)}`; };
    const focar = async (el) => {
      $$('.teste-foco').forEach((x) => x.classList.remove('teste-foco'));
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.classList.add('teste-foco'); await esperar(380);
    };
    const achar = async (sel, ms = 4000, raiz = document) => {
      const fim = Date.now() + ms;
      while (Date.now() < fim) { const el = typeof sel === 'function' ? sel() : raiz.querySelector(sel); if (el) return el; await esperar(80); }
      throw new Error(`Não encontrei na tela: ${typeof sel === 'function' ? 'elemento esperado' : sel}`);
    };
    return {
      passo,
      esperar,
      async ir(hash, nome) { passo(`Abrindo ${nome || hash}`); if (location.hash !== hash) { location.hash = hash; } else App.render(); await esperar(450); },
      achar,
      async ver(sel, desc) { passo(desc ? `Conferindo: ${desc}` : `Procurando ${sel}`); const el = await achar(sel); await focar(el); return el; },
      async clicar(sel, desc) { const el = typeof sel === 'string' || typeof sel === 'function' ? await achar(sel) : sel; passo(`Tocando em “${desc || (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40)}”`); await focar(el); el.click(); await esperar(350); return el; },
      async digitar(sel, txt, desc) { const el = await achar(sel); passo(`Digitando ${desc || ''} “${txt}”`); await focar(el); el.value = txt; el.dispatchEvent(new Event('input', { bubbles: true })); await esperar(250); return el; },
      ok(cond, msg) { if (!cond) throw new Error(msg); passo('✓ ' + msg.replace(/^Esperava /, '')); },
      async esperarQue(fn, msg, ms = 5000) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await fn()) { passo('✓ ' + msg); return; } await esperar(120); } throw new Error('Não aconteceu: ' + msg); },
      texto: (sel) => (($(sel) || {}).innerText || '')
    };
  }

  const CASOS = [
    // ---------- SITE ----------
    { modulo: 'Site', nome: 'Página inicial abre com o logo', async fn(h) {
      await h.ir('#/', 'o site'); const img = await h.ver('.hero-logo img', 'logo da escola');
      await h.esperarQue(() => img.complete && img.naturalWidth > 0, 'o logo carregou');
      h.ok(/CAMINHO/i.test(h.texto('.hero h1')), 'Esperava o título principal'); } },
    { modulo: 'Site', nome: 'Menu leva até a seção de horários', async fn(h) {
      await h.ir('#/', 'o site');
      if (getComputedStyle($('#menu-btn')).display !== 'none') await h.clicar('#menu-btn', 'menu');
      await h.clicar('#site-nav a[href="#/site/grade"]', 'Horários');
      await h.esperarQue(() => { const r = $('#grade').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, 'a seção Horários apareceu'); } },
    { modulo: 'Unidades', nome: 'Cada unidade tem “Como chegar” no Google Maps', async fn(h) {
      await h.ir('#/site/unidades', 'Unidades');
      const links = $$('#unidades .unit-actions a.btn-primary'); await h.ver('#unidades .unit-actions a', 'botões Como chegar');
      h.ok(links.length >= 3, `Esperava 3 unidades com Como chegar (achei ${links.length})`);
      h.ok(links.every((a) => a.href.startsWith('https://www.google.com/maps/dir/')), 'Esperava links de rota do Google Maps'); } },
    { modulo: 'Horários', nome: 'Filtro por unidade (Hammer BSB)', async fn(h) {
      await h.ir('#/site/grade', 'Horários');
      await h.clicar('#f-unid [data-u="hammer"]', 'Hammer BSB');
      const unidades = $$('#grade-box .slot small').map((s) => s.textContent);
      h.ok(unidades.length > 0 && unidades.every((u) => u === 'Hammer BSB'), 'Esperava só horários da Hammer BSB');
      await h.clicar('#f-unid [data-u="todas"]', 'Todas as unidades'); } },
    { modulo: 'Horários', nome: 'Filtro só turmas infantis', async fn(h) {
      await h.ir('#/site/grade', 'Horários');
      await h.clicar('#f-pub [data-p="infantil"]', 'Infantil');
      const slots = $$('#grade-box .slot'); h.ok(slots.length > 0 && slots.every((s) => s.classList.contains('infantil')), 'Esperava só turmas infantis');
      await h.clicar('#f-pub [data-p="todos"]', 'Todos'); } },
    { modulo: 'Planos', nome: 'Valores aparecem (R$ 150 e R$ 100)', async fn(h) {
      await h.ir('#/site/planos', 'Planos'); await h.ver('#planos .preco', 'preços');
      const t = h.texto('#planos'); h.ok(/R\$\s*150/.test(t) && /R\$\s*100/.test(t), 'Esperava ver R$ 150 e R$ 100'); } },
    { modulo: 'Site', nome: 'Perguntas frequentes abrem', async fn(h) {
      await h.ir('#/site/faq', 'Dúvidas'); const d = await h.ver('#faq details', 'primeira pergunta');
      await h.clicar('#faq details summary', 'primeira pergunta'); h.ok(d.open, 'Esperava a resposta aberta'); } },
    { modulo: 'Aula experimental', nome: 'Assistente agenda aula experimental sozinho', async fn(h) {
      await h.ir('#/', 'o site'); const antes = store.get('experimentais', []).length;
      await h.clicar('[data-exp]', 'Agendar aula experimental grátis');
      await h.achar('#chat-body'); await h.esperar(1300);
      for (const [fala, esp] of [['Teste Automático', 900], ['Para mim (adulto)', 900], ['Hammer BSB', 1000]]) { h.passo(`Respondendo ao assistente: “${fala}”`); App.Agente.usuario(fala); await h.esperar(esp); }
      const op = await h.achar('#chat-quick button'); await h.clicar(op, op.textContent);
      await h.esperar(900); h.passo('Informando o WhatsApp'); App.Agente.usuario('61 90000-0000'); await h.esperar(1100);
      h.ok(/AGENDADA/.test(h.texto('#chat-body')), 'Esperava a confirmação “Aula experimental AGENDADA”');
      h.ok(store.get('experimentais', []).length === antes + 1, 'Esperava o agendamento salvo');
      App.Agente.toggle(false); } },
    { modulo: 'Aula experimental', nome: 'Agendamento aparece no painel do professor', async fn(h) {
      await h.ir('#/admin/experimentais', 'Painel › Aulas experimentais');
      await h.ver('.admin-main table', 'lista de experimentais'); h.ok(/Teste Automático/.test(h.texto('.admin-main table')), 'Esperava ver “Teste Automático” na lista'); } },

    // ---------- APP DO ALUNO ----------
    { modulo: 'App do aluno', nome: 'Início mostra faixa, grau e progresso', async fn(h) {
      await h.ir('#/app/inicio', 'App › Início'); await h.ver('.belt-card', 'cartão da faixa');
      h.ok(/Faixa .+ grau/.test(h.texto('.belt-card')), 'Esperava faixa e grau'); } },
    { modulo: 'Agendamentos', nome: 'Agendar uma aula na agenda', async fn(h) {
      await h.ir('#/app/agenda', 'App › Agenda');
      await h.clicar('.seg [data-un="todas"]', 'Todas as unidades');
      for (let i = 0; i < 7 && !$('.class-item [data-k]'); i++) await h.clicar(`[data-dia="${i}"]`, 'outro dia');
      const b = await h.achar('.class-item [data-k]:not(.ok)'); const k = b.dataset.k;
      await h.clicar(b, 'Agendar');
      await h.esperarQue(() => { const x = document.querySelector(`[data-k="${CSS.escape(k)}"]`); return x && x.classList.contains('ok'); }, 'a aula ficou “✓ Agendado”');
      store.set('_t_k', k); } },
    { modulo: 'Agendamentos', nome: 'Cancelar o agendamento libera a vaga', async fn(h) {
      const k = store.get('_t_k', null); h.ok(!!k, 'Esperava uma aula agendada no passo anterior');
      const b = await h.achar(() => document.querySelector(`[data-k="${CSS.escape(k)}"]`)); await h.clicar(b, '✓ Agendado (cancelar)');
      await h.esperarQue(() => { const x = document.querySelector(`[data-k="${CSS.escape(k)}"]`); return x && !x.classList.contains('ok'); }, 'voltou para “Agendar”'); } },
    { modulo: 'Baixa de aulas', nome: 'Check-in por QR registra a aula', async fn(h) {
      store.set('checkinHoje', null); const antes = store.get('aulasExtras', 0);
      await h.ir('#/app/checkin', 'App › Check-in'); await h.clicar('#simular', 'Simular leitura do QR');
      await h.ver('.check-ok', 'presença confirmada'); h.ok(store.get('aulasExtras', 0) === antes + 1, 'Esperava +1 aula contada para a graduação'); } },
    { modulo: 'App do aluno', nome: 'Evolução mostra progresso e linha do tempo', async fn(h) {
      await h.ir('#/app/evolucao', 'App › Evolução'); await h.ver('.timeline', 'linha do tempo'); h.ok($$('.tl-item').length >= 2, 'Esperava graduações na linha do tempo'); } },
    { modulo: 'Pagamentos / Pix', nome: 'Pagar mensalidade com Pix e baixa automática', async fn(h) {
      await h.ir('#/app/pagamentos', 'App › Pagamentos'); const antes = store.get('pagos', []).length;
      await h.clicar('[data-pagar]', 'Pagar com Pix'); await h.ver('.pix-qr', 'QR code do Pix');
      await h.clicar('#simpag', 'Simular pagamento feito no banco');
      await h.esperarQue(() => store.get('pagos', []).length === antes + 1, 'pagamento recebido e baixa feita', 4000);
      await h.esperar(1500); h.ok(/✓ Pago/.test(h.texto('.app-body')), 'Esperava o pagamento no histórico'); } },
    { modulo: 'Reconhecimento facial', nome: 'Perfil oferece cadastro do rosto', async fn(h) {
      await h.ir('#/app/perfil', 'App › Perfil'); await h.ver('[data-rosto], [data-rosto-del]', 'cadastro do rosto'); } },
    { modulo: 'Aplicativo', nome: 'Todas as abas do menu do app abrem', async fn(h) {
      await h.ir('#/app/inicio', 'App');
      for (const id of ['agenda', 'checkin', 'evolucao', 'pagamentos', 'inicio']) { await h.clicar(`.tabbar a[href="#/app/${id}"]`, id); await h.esperarQue(() => location.hash === '#/app/' + id && $('.app-body'), `a aba ${id} abriu`, 2000); } } },

    // ---------- PAINEL DO PROFESSOR ----------
    { modulo: 'Área do professor', nome: 'Tela “Hoje” com indicadores e presença', async fn(h) {
      await h.ir('#/admin/hoje', 'Painel › Hoje'); await h.ver('.kpis .kpi', 'indicadores'); await h.ver('[data-pres]', 'lista de presença'); } },
    { modulo: 'Baixa de aulas', nome: 'Professor marca e desmarca presença', async fn(h) {
      await h.ir('#/admin/hoje', 'Painel › Hoje'); const t = await h.achar('[data-pres]'); const id = t.dataset.pres; const antes = t.classList.contains('on');
      await h.clicar(t, 'presença do aluno'); h.ok($(`[data-pres="${id}"]`).classList.contains('on') !== antes, 'Esperava a presença alterada');
      await h.clicar(`[data-pres="${id}"]`, 'presença do aluno (voltar)'); } },
    { modulo: 'Área do professor', nome: 'Busca de alunos filtra a lista', async fn(h) {
      await h.ir('#/admin/alunos', 'Painel › Alunos'); await h.digitar('#busca', 'Ana', 'na busca');
      const linhas = $$('.admin-main tbody tr'); h.ok(linhas.length >= 1 && linhas.every((tr) => /ana/i.test(tr.innerText)), 'Esperava só alunos com “Ana”');
      await h.digitar('#busca', '', 'limpando a busca'); } },
    { modulo: 'Área do professor', nome: 'Graduar aluno pronto', async fn(h) {
      await h.ir('#/admin/graduacoes', 'Painel › Graduações'); const b = await h.achar('[data-grad]'); const id = +b.dataset.grad;
      await h.clicar(b, 'Graduar'); h.ok(DB.alunos.find((a) => a.id === id).aulas === 0, 'Esperava a contagem reiniciada após graduar'); } },
    { modulo: 'Planos', nome: 'Esconder valores no painel reflete no site', async fn(h) {
      await h.ir('#/admin/financeiro', 'Painel › Financeiro'); await h.clicar('#tg-precos', 'Mostrar valores no site');
      await h.ir('#/site/planos', 'Site › Planos'); await h.ver('#planos .preco', 'preços');
      const esc_ = !store.get('mostrarPrecos', true); h.ok(esc_ ? /Consulte/.test(h.texto('#planos')) && !/R\$\s*150/.test(h.texto('#planos')) : /R\$\s*150/.test(h.texto('#planos')), 'Esperava o site obedecer à configuração');
      await h.ir('#/admin/financeiro', 'Painel › Financeiro'); await h.clicar('#tg-precos', 'Mostrar valores no site (voltar)'); } },
    { modulo: 'Agente / WhatsApp', nome: 'Ligar e desligar automação', async fn(h) {
      await h.ir('#/admin/automacoes', 'Painel › Automações'); const t = await h.achar('[data-auto]'); const antes = t.classList.contains('on');
      await h.clicar(t, 'automação'); h.ok($(`[data-auto="${t.dataset.auto}"]`).classList.contains('on') !== antes, 'Esperava a automação alterada');
      await h.clicar(`[data-auto="${t.dataset.auto}"]`, 'automação (voltar)'); } },
    { modulo: 'Reconhecimento facial', nome: 'Histórico “Presenças & fotos” carrega', async fn(h) {
      await h.ir('#/admin/presencas', 'Painel › Presenças & fotos'); await h.esperarQue(() => !/Carregando/.test(h.texto('#hist-presencas')), 'o histórico carregou'); } },
    { modulo: 'Navegação', nome: 'Todas as telas abrem sem erro', async fn(h) {
      const rotas = ['#/', '#/app/inicio', '#/app/agenda', '#/app/checkin', '#/app/evolucao', '#/app/pagamentos', '#/app/perfil', '#/app/notificacoes', '#/admin/hoje', '#/admin/presencas', '#/admin/alunos', '#/admin/graduacoes', '#/admin/financeiro', '#/admin/experimentais', '#/admin/automacoes', '#/admin/grade'];
      for (const r of rotas) { await h.ir(r, r); h.ok($('#root').children.length > 0 && $('#root').innerText.length > 50, `Esperava conteúdo em ${r}`); } } },

    // ---------- FERRAMENTAS E APP ----------
    { modulo: 'Sugestões', nome: 'Central de sugestões abre e troca de aba', async fn(h) {
      await Sugestoes.abrir('lista'); await h.ver('#central-sug .central-abas', 'abas da central');
      for (const a of ['nova', 'aprovar', 'aprovadas', 'lista']) await h.clicar(`#central-sug [data-aba="${a}"]`, a);
      Sugestoes.fechar(); } },
    { modulo: 'Sugestões', nome: 'Salvar e enviar uma sugestão', async fn(h) {
      if (Equipe.compartilhado) { h.passo('Pulado na lista compartilhada (não grava sugestão de teste no banco real)'); return; }
      const nome = Equipe.eu().nome;
      const s = await Equipe.chamar('tw_sug_criar', { p_solicitante: nome, p_descricao: '[teste automático] sugestão de exemplo', p_area: 'Geral' });
      await Sugestoes.abrir('lista'); await h.ver('#c-enviar:not([disabled])', 'botão Enviar liberado');
      await h.clicar('#c-enviar', 'Enviar minhas sugestões');
      await h.clicar('#env-ok', 'confirmar o envio');
      await h.esperarQue(async () => { const l = await Equipe.chamar('tw_sug_listar'); const x = l.find((y) => y.id === s.id); return x && x.situacao === 'Enviada' && x.enviada_por === nome; }, 'a sugestão ficou “Enviada” com nome e hora');
      Sugestoes.fechar(); } },
    { modulo: 'Aplicativo', nome: 'App instalável: manifesto e ícones', async fn(h) {
      h.passo('Lendo o manifesto do app'); const man = await (await fetch('manifest.webmanifest', { cache: 'no-store' })).json();
      h.ok(man.icons && man.icons.length >= 2 && man.start_url, 'Esperava manifesto com ícones e página inicial');
      for (const i of man.icons) { const r = await fetch(i.src, { cache: 'no-store' }); h.ok(r.ok, `Ícone ${i.src} carregou`); } } },
    { modulo: 'Aplicativo', nome: 'Atualização automática ativa (service worker)', async fn(h) {
      h.passo('Conferindo o serviço de atualização');
      if (!('serviceWorker' in navigator)) throw Object.assign(new Error('Este navegador não suporta app instalável'), { aviso: true });
      const r = await navigator.serviceWorker.getRegistration(); h.ok(!!r, 'Esperava o serviço de atualização registrado'); } }
  ];

  const CASOS_FACIAIS = [
    { modulo: 'Reconhecimento facial', nome: 'Modelos carregam e acham rostos numa foto', tempo: 90000, async fn(h) {
      h.passo('Baixando o reconhecimento facial (só na 1ª vez)'); const f = await Rosto.carregar((t) => h.passo(t));
      h.passo('Analisando foto de exemplo com 3 pessoas'); const img = await f.fetchImage('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/demo/sample1.jpg');
      const r = await f.detectAllFaces(img, new f.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptors();
      h.ok(r.length >= 3, `Esperava 3 rostos (achei ${r.length})`); store.set('_t_desc', Array.from(r[0].descriptor)); } },
    { modulo: 'Reconhecimento facial', nome: 'Reconhece a mesma pessoa depois de aprender', async fn(h) {
      const f = window.faceapi; const d = store.get('_t_desc', null); h.ok(!!(f && d), 'Esperava o passo anterior concluído');
      const img = await f.fetchImage('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/demo/sample1.jpg');
      const r = await f.detectAllFaces(img, new f.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptors();
      const dist = Math.min(...r.map((x) => f.euclideanDistance(x.descriptor, d)));
      h.ok(dist < 0.5, `Esperava reconhecer (semelhança ${Math.round((1 - dist) * 100)}%)`); } }
  ];

  async function rodarAutomatico({ facial } = {}) {
    if (rodando) return;
    const quem = (await Equipe.identificar()).nome;
    rodando = true; parar = false;
    const casos = [...CASOS, ...(facial ? CASOS_FACIAIS : [])].map((c) => ({ ...c, passos: [], status: 'pendente' }));
    // ---- caixa de areia: guarda tudo e bloqueia efeitos externos ----
    const copia = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('tw:')) copia[k] = localStorage.getItem(k); }
    const alunos = JSON.parse(JSON.stringify(DB.alunos));
    const orig = { open: window.open, confirm: window.confirm, prompt: window.prompt, alert: window.alert, hash: location.hash };
    window.open = () => null; window.confirm = () => true; window.__twSemDialogos = true; window.prompt = () => null; window.alert = () => {};
    let erroAtual = null; const pegaErro = (e) => { erroAtual = (e && (e.message || (e.reason && e.reason.message))) || 'Erro'; };
    window.addEventListener('error', pegaErro); window.addEventListener('unhandledrejection', pegaErro);
    document.body.classList.add('testando');
    painelAuto(casos);
    const inicio = new Date();
    for (let i = 0; i < casos.length; i++) {
      if (parar) { casos.slice(i).forEach((c) => { c.status = 'nao-rodou'; }); break; }
      const c = casos[i]; const li = $('#ta-' + i); li.classList.add('agora'); li.querySelector('.ta-st').textContent = '▶️';
      li.scrollIntoView({ block: 'nearest' });
      $('#ta-cont').textContent = `${i + 1}/${casos.length}`; $('#ta-barra').style.width = `${(i / casos.length) * 100}%`;
      const t0 = performance.now(); erroAtual = null;
      try {
        await Promise.race([c.fn(ajudantes(c)), esperar(c.tempo || 20000).then(() => { throw new Error('Demorou demais (travou?)'); })]);
        if (erroAtual) throw new Error('Erro durante o teste: ' + erroAtual);
        c.status = 'ok';
      } catch (e) {
        c.status = e.aviso ? 'aviso' : 'falha'; c.erro = e.message; c.tela = App.telaAtual(); c.tecnico = (e.stack || '').split('\n').slice(0, 3).join(' | ');
      }
      c.ms = Math.round(performance.now() - t0);
      li.classList.remove('agora'); li.classList.add(c.status); li.querySelector('.ta-st').textContent = { ok: '✅', falha: '❌', aviso: '⚠️' }[c.status];
      if (c.erro) li.insertAdjacentHTML('beforeend', `<small class="ta-erro">${esc(c.erro)}</small>`);
      $$('.teste-foco').forEach((x) => x.classList.remove('teste-foco'));
    }
    $('#ta-barra').style.width = '100%';
    // ---- devolve tudo como estava ----
    window.removeEventListener('error', pegaErro); window.removeEventListener('unhandledrejection', pegaErro);
    Object.keys(localStorage).filter((k) => k.startsWith('tw:') && !(k in copia) && !k.startsWith('tw:registro')).forEach((k) => localStorage.removeItem(k));
    Object.entries(copia).forEach(([k, v]) => { if (k !== 'tw:registro') localStorage.setItem(k, v); });
    DB.alunos.splice(0, DB.alunos.length, ...alunos);
    Object.assign(window, { open: orig.open, confirm: orig.confirm, prompt: orig.prompt, alert: orig.alert }); window.__twSemDialogos = false;
    document.body.classList.remove('testando');
    try { App.Agente.toggle(false); } catch (e) { }
    $$('.modal-bg').forEach((m) => m.remove()); Sugestoes.fechar();
    location.hash = orig.hash || '#/'; App.render();
    painel.remove(); rodando = false;

    const fim = new Date();
    const rel = {
      tipo: 'automatico', responsavel: quem, inicio: inicio.toISOString(), fim: fim.toISOString(), duracao: (fim - inicio) / 1000,
      aparelho: App.aparelho(), versao: App.VERSAO, base: Equipe.compartilhado ? 'compartilhada' : 'local',
      casos: casos.map(({ fn, passos, ...c }) => ({ ...c, passos: passos.slice(-6) })),
      resumo: { total: casos.length, ok: casos.filter((c) => c.status === 'ok').length, falhas: casos.filter((c) => c.status === 'falha').length, avisos: casos.filter((c) => c.status === 'aviso').length, nao_rodou: casos.filter((c) => c.status === 'nao-rodou').length }
    };
    App.registrar(rel.resumo.falhas ? 'erro' : 'acao', `Teste automático: ${rel.resumo.ok}/${rel.resumo.total} ok, ${rel.resumo.falhas} falha(s)`);
    await salvarRelatorio(rel);
    mostrarRelatorio(rel, { salvo: true });
  }

  // =====================================================================
  // TESTE MANUAL ACOMPANHADO
  // =====================================================================
  const ativo = () => store.get('teste-ativo', null);
  function anotar(ev) {
    const t = ativo(); if (!t) return;
    t.eventos.push({ em: new Date().toISOString(), tela: App.telaAtual(), hash: location.hash || '#/', ...ev });
    if (t.eventos.length > 600) t.eventos = t.eventos.slice(-600);
    store.set('teste-ativo', t); barra();
  }

  async function iniciarManual() {
    const quem = (await Equipe.identificar()).nome;
    store.set('teste-ativo', { id: Date.now(), responsavel: quem, inicio: new Date().toISOString(), aparelho: App.aparelho(), eventos: [{ em: new Date().toISOString(), tipo: 'tela', tela: App.telaAtual(), hash: location.hash || '#/', msg: 'Início do teste' }] });
    ligarMonitor(); barra();
    modal(`<h3>🔴 Teste iniciado</h3>
      <p>Agora é só <b>usar o sistema normalmente</b>: navegue pelo site, pelo app do aluno e pelo painel do professor, agende aulas, pague o Pix, teste a foto da turma…</p>
      <p>A barra vermelha embaixo mostra que estamos anotando. Viu algo estranho? Toque em <b>📝 Anotar problema</b>.</p>
      <p>Quando terminar, toque em <b>⏹ Finalizar</b> para ver e enviar o relatório.</p>
      <button class="btn btn-primary btn-block" data-close>Começar</button>`);
  }

  let relogio = null;
  function barra() {
    const t = ativo(); let b = $('#teste-barra');
    if (!t) { b && b.remove(); document.body.classList.remove('com-teste'); clearInterval(relogio); relogio = null; return; }
    if (!b) {
      b = document.createElement('div'); b.id = 'teste-barra'; b.className = 'teste-barra'; document.body.appendChild(b);
      document.body.classList.add('com-teste');
      relogio = setInterval(barra, 1000);
    }
    const s = (Date.now() - new Date(t.inicio)) / 1000;
    const n = (tp) => t.eventos.filter((e) => e.tipo === tp).length;
    b.innerHTML = `<span class="tb-rec">●</span><span class="tb-info"><b>Teste em andamento</b> · ${dur(s)}<small>${new Set(t.eventos.filter((e) => e.tipo === 'tela').map((e) => e.tela)).size} telas · ${n('sucesso')} ações ok · <span style="${n('erro') ? 'color:#ffb3b3;font-weight:800' : ''}">${n('erro')} erro(s)</span> · ${n('problema')} anotação(ões)</small></span>
      <button id="tb-anotar" aria-label="Anotar problema">📝<span class="tb-l"> Anotar problema</span></button><button id="tb-fim" aria-label="Finalizar teste">⏹<span class="tb-l"> Finalizar</span></button>`;
    $('#tb-anotar', b).onclick = anotarProblema; $('#tb-fim', b).onclick = finalizarManual;
  }

  function anotarProblema(alvo) {
    alvo = alvo && alvo.onde ? alvo : null;
    modal(`<h3>📝 Anotar problema</h3>
      <p class="a-muted" style="margin-top:0">Conte o que aconteceu, do seu jeito. Ex.: “cliquei em Agendar e nada aconteceu”.</p>
      ${alvo ? `<div class="rastro"><small>📍 Onde</small><b>${esc(alvo.onde)}</b></div>` : `<button class="btn btn-block marcar-btn" id="pr-marcar">🎯 Marcar na tela onde foi (opcional)</button>`}
      <p class="a-muted" style="font-size:13px;margin:8px 0">Tela atual: <b>${esc(App.telaAtual())}</b></p>
      <textarea id="pr-txt" rows="3" placeholder="O que aconteceu?">${esc(store.get('pr-rasc', ''))}</textarea>
      <button class="btn btn-primary btn-block" id="pr-ok">Salvar anotação</button>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Cancelar</button>`, (m, f) => {
      const tx = $('#pr-txt', m); tx.oninput = () => store.set('pr-rasc', tx.value); setTimeout(() => tx.focus(), 50);
      const mk = $('#pr-marcar', m); if (mk) mk.onclick = () => { f(); App.modoMarcar((a) => anotarProblema(a)); };
      $('#pr-ok', m).onclick = () => { const v = tx.value.trim(); if (!v) return tx.focus(); anotar({ tipo: 'problema', msg: v, onde: alvo }); store.set('pr-rasc', ''); f(); toast('📝 Problema anotado no teste'); };
    });
  }

  // nomes amigáveis das funcionalidades a partir das telas e ações
  function funcionalidade(e) {
    const m = e.msg || '';
    if (/Pix|Mensalidade/i.test(m)) return 'Baixa de pagamentos via Pix';
    if (/Check-in|Presença|presença/i.test(m)) return 'Baixa de aulas / presença';
    if (/Rosto|foto/i.test(m)) return 'Reconhecimento de fotos';
    if (/experimental/i.test(m)) return 'Aula experimental';
    if (/Aula agendada|Agendamento/i.test(m)) return 'Agendamentos';
    if (/Sugest|Apoiou|Admin:/i.test(m)) return 'Sugestões';
    if (/Graduaç/i.test(m)) return 'Graduações';
    const t = e.tela || '';
    if (/Horários/.test(t) || /grade/.test(e.hash || '')) return 'Horários';
    if (/Unidades/.test(t)) return 'Unidades';
    if (/Planos/.test(t)) return 'Visualização de planos';
    if (/^App do aluno/.test(t)) return 'Área do aluno (app)';
    if (/^Painel do professor/.test(t)) return 'Área do professor';
    return 'Site';
  }

  async function finalizarManual() {
    const t = ativo(); if (!t) return;
    const fim = new Date();
    const ev = t.eventos;
    const telas = [...new Set(ev.filter((e) => e.tipo === 'tela').map((e) => e.tela))];
    const contFunc = {}; ev.filter((e) => ['tela', 'sucesso', 'clique'].includes(e.tipo)).forEach((e) => { const f = funcionalidade(e); contFunc[f] = (contFunc[f] || 0) + 1; });
    const erros = ev.filter((e) => e.tipo === 'erro').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg, tecnico: [e.arquivo && `${e.arquivo}:${e.linha}:${e.coluna}`, e.pilha].filter(Boolean).join(' | ') }));
    const problemas = ev.filter((e) => e.tipo === 'problema').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg, onde: e.onde ? e.onde.onde : '', ref: e.onde ? `${e.onde.hash} | ${e.onde.seletor}` : e.hash }));
    const sucessos = ev.filter((e) => e.tipo === 'sucesso').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg }));
    const rel = {
      tipo: 'manual', responsavel: t.responsavel, inicio: t.inicio, fim: fim.toISOString(), duracao: (fim - new Date(t.inicio)) / 1000,
      aparelho: App.aparelho(), versao: App.VERSAO, base: Equipe.compartilhado ? 'compartilhada' : 'local',
      telas, funcionalidades: Object.entries(contFunc).map(([nome, vezes]) => ({ nome, vezes })).sort((a, b) => b.vezes - a.vezes),
      sucessos, erros, problemas, cliques: ev.filter((e) => e.tipo === 'clique').length,
      linha_do_tempo: ev.slice(-80).map((e) => ({ em: e.em, tipo: e.tipo, tela: e.tela, msg: e.msg })),
      resumo: { total: sucessos.length + erros.length + problemas.length, ok: sucessos.length, falhas: erros.length + problemas.length, erros: erros.length, problemas: problemas.length, telas: telas.length }
    };
    store.set('teste-ativo', null); barra(); desligarMonitor();
    await salvarRelatorio(rel);
    mostrarRelatorio(rel, { salvo: true });
  }

  // monitor: cliques, telas e console.error (só enquanto há teste manual ativo)
  let consoleOrig = null;
  const aoClicar = (e) => {
    if (!ativo() || e.target.closest('#teste-barra, .modal-bg')) return;
    const el = e.target.closest('button, a, [role=button], input[type=checkbox], select, .slot, .class-item'); if (!el) return;
    const rot = (el.getAttribute('aria-label') || el.innerText || el.title || el.value || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 50);
    anotar({ tipo: 'clique', msg: rot });
  };
  function ligarMonitor() {
    document.addEventListener('click', aoClicar, true);
    if (!consoleOrig) { consoleOrig = console.error; console.error = function (...a) { try { App.registrar('erro', 'console: ' + a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 300)); } catch (e) { } return consoleOrig.apply(console, a); }; }
  }
  function desligarMonitor() { document.removeEventListener('click', aoClicar, true); if (consoleOrig) { console.error = consoleOrig; consoleOrig = null; } }

  // chamado pelo App.registrar e a cada troca de tela
  function evento(item) { if (!ativo()) return; anotar({ tipo: item.tipo === 'erro' ? 'erro' : 'sucesso', msg: item.msg, arquivo: item.arquivo, linha: item.linha, coluna: item.coluna, pilha: item.pilha }); }
  let ultimaTela = '';
  function aoMudarTela() { if (!ativo()) return; const t = App.telaAtual(); if (t !== ultimaTela) { ultimaTela = t; anotar({ tipo: 'tela', msg: 'Abriu ' + t }); } }

  // retoma o teste se a página recarregar
  function retomar() { if (ativo()) { ligarMonitor(); barra(); } }

  // =====================================================================
  // RELATÓRIOS
  // =====================================================================
  async function salvarRelatorio(rel) {
    const resumo = { ...rel.resumo, duracao: rel.duracao };
    try { rel.id = await Equipe.chamar('tw_teste_salvar', { p_responsavel: rel.responsavel, p_tipo: rel.tipo, p_resumo: resumo, p_relatorio: rel }); }
    catch (e) { toast('⚠️ Não consegui salvar o relatório: ' + e.message, 5000); store.set('relatorio-pendente', rel); }
  }

  function textoRelatorio(r) {
    const cab = `*Relatório de teste ${r.tipo === 'automatico' ? 'AUTOMÁTICO' : 'MANUAL'} — The Way*\n👤 ${r.responsavel}\n🕒 ${dh(r.inicio)} → ${dh(r.fim)} (${dur(r.duracao)})\n🛠 ${r.aparelho}\n`;
    if (r.tipo === 'automatico') {
      return cab + `\n*Resultado:* ✅ ${r.resumo.ok} ok · ❌ ${r.resumo.falhas} falha(s) · ⚠️ ${r.resumo.avisos} aviso(s) de ${r.resumo.total}\n\n` +
        r.casos.map((c) => `${{ ok: '✅', falha: '❌', aviso: '⚠️', 'nao-rodou': '⏸' }[c.status] || '•'} [${c.modulo}] ${c.nome}${c.erro ? `\n   ↳ ${c.erro}${c.tela ? ` (tela: ${c.tela})` : ''}` : ''}`).join('\n');
    }
    return cab + `\n*Funcionalidades usadas:* ${r.funcionalidades.map((f) => f.nome).join(', ') || '—'}\n*Telas:* ${r.telas.length} · *Cliques:* ${r.cliques}\n` +
      `\n*✅ Concluído com sucesso (${r.sucessos.length})*\n${r.sucessos.slice(-15).map((s) => `• ${s.descricao}`).join('\n') || '—'}\n` +
      `\n*❌ Erros do sistema (${r.erros.length})*\n${r.erros.map((e) => `• ${dh(e.em).slice(11)} · ${e.tela}\n   ${e.descricao}${e.tecnico ? `\n   🔧 ${e.tecnico.slice(0, 200)}` : ''}`).join('\n') || '—'}\n` +
      `\n*📝 Problemas anotados (${r.problemas.length})*\n${r.problemas.map((p) => `• ${p.tela}${p.onde ? ` › ${p.onde}` : ''}\n   ${p.descricao}`).join('\n') || '—'}`;
  }

  function mostrarRelatorio(r, { salvo } = {}) {
    const st = { ok: '✅', falha: '❌', aviso: '⚠️', 'nao-rodou': '⏸' };
    modal(`
      <h3>📄 Relatório — teste ${r.tipo === 'automatico' ? 'automático' : 'manual'}</h3>
      <div class="r-cab"><div><small>Responsável</small><b>${esc(r.responsavel)}</b></div><div><small>Data e horário</small><b>${dh(r.inicio)}</b></div><div><small>Duração</small><b>${dur(r.duracao)}</b></div></div>
      <div class="r-res">
        <span class="r-n ok">✅ ${r.resumo.ok}<small>${r.tipo === 'automatico' ? 'funcionando' : 'ações ok'}</small></span>
        <span class="r-n falha">❌ ${r.tipo === 'automatico' ? r.resumo.falhas : r.erros.length}<small>${r.tipo === 'automatico' ? 'com falha' : 'erros'}</small></span>
        ${r.tipo === 'automatico' ? `<span class="r-n aviso">⚠️ ${r.resumo.avisos}<small>avisos</small></span>` : `<span class="r-n aviso">📝 ${r.problemas.length}<small>anotados</small></span>`}
      </div>
      ${r.tipo === 'automatico' ? `<ul class="r-lista">${r.casos.map((c) => `<li class="${c.status}"><span>${st[c.status] || '•'}</span><div><small>${esc(c.modulo)}${c.ms ? ` · ${(c.ms / 1000).toFixed(1)} s` : ''}</small>${esc(c.nome)}${c.erro ? `<div class="r-erro">${esc(c.erro)}${c.tela ? `<br><small>Tela: ${esc(c.tela)}</small>` : ''}${c.passos && c.passos.length ? `<br><small>Últimos passos: ${esc(c.passos.join(' → '))}</small>` : ''}</div>` : ''}</div></li>`).join('')}</ul>`
      : `<div class="a-section-title">Funcionalidades utilizadas</div><p style="margin:0">${r.funcionalidades.map((f) => `<span class="chip blue" style="margin:2px">${esc(f.nome)}</span>`).join('') || '—'}</p>
        <div class="a-section-title">Processos concluídos com sucesso (${r.sucessos.length})</div>
        <ul class="r-lista">${r.sucessos.slice(-20).map((s) => `<li class="ok"><span>✅</span><div><small>${dh(s.em).slice(11)} · ${esc(s.tela)}</small>${esc(s.descricao)}</div></li>`).join('') || '<li>—</li>'}</ul>
        <div class="a-section-title">Erros identificados (${r.erros.length})</div>
        <ul class="r-lista">${r.erros.map((e) => `<li class="falha"><span>❌</span><div><small>${dh(e.em).slice(11)} · ${esc(e.tela)}</small>${esc(e.descricao)}${e.tecnico ? `<div class="r-erro"><small>🔧 ${esc(e.tecnico.slice(0, 300))}</small></div>` : ''}</div></li>`).join('') || '<li>Nenhum erro 🎉</li>'}</ul>
        <div class="a-section-title">Problemas anotados (${r.problemas.length})</div>
        <ul class="r-lista">${r.problemas.map((p) => `<li class="aviso"><span>📝</span><div><small>${dh(p.em).slice(11)} · ${esc(p.tela)}${p.onde ? ' › ' + esc(p.onde) : ''}</small>${esc(p.descricao)}</div></li>`).join('') || '<li>—</li>'}</ul>`}
      <p class="a-muted" style="font-size:12px">🛠 ${esc(r.aparelho)} · base ${esc(r.base || '')} ${salvo && r.id ? `· relatório nº ${r.id} salvo ✓` : ''}</p>
      <button class="btn btn-ok btn-block" id="r-zap">📤 Enviar relatório pelo WhatsApp</button>
      <div class="a-row" style="gap:8px;margin-top:8px">
        <button class="btn btn-ghost btn-sm" style="flex:1" id="r-copiar">Copiar texto</button>
        ${(r.tipo === 'manual' && (r.erros.length || r.problemas.length)) || (r.tipo === 'automatico' && r.resumo.falhas) ? `<button class="btn btn-ghost btn-sm" style="flex:1" id="r-sug">💡 Virar sugestões</button>` : ''}
      </div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px;border-color:transparent">Fechar</button>
    `, (m, fechar) => {
      $('#r-zap', m).onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(textoRelatorio(r)), '_blank', 'noopener');
      $('#r-copiar', m).onclick = () => { try { navigator.clipboard.writeText(textoRelatorio(r)); toast('Relatório copiado ✓'); } catch (e) { toast('Não deu para copiar'); } };
      const sg = $('#r-sug', m);
      if (sg) sg.onclick = async () => {
        const itens = r.tipo === 'automatico' ? r.casos.filter((c) => c.status === 'falha').map((c) => ({ area: c.modulo, d: `[Teste automático] Falhou: ${c.nome} — ${c.erro}`, tela: c.tela || '' }))
          : [...r.erros.map((e) => ({ area: 'Geral', d: `[Erro no teste] ${e.descricao}`, tela: e.tela, obs: e.tecnico })), ...r.problemas.map((p) => ({ area: 'Geral', d: p.descricao, tela: p.tela, obs: p.onde ? 'Onde: ' + p.onde : '' }))];
        if (!(await App.confirmar(`Criar ${itens.length} sugestão(ões) na lista da equipe a partir deste relatório?`, 'Criar'))) return;
        let n = 0; for (const i of itens) { try { await Equipe.chamar('tw_sug_criar', { p_solicitante: r.responsavel, p_descricao: i.d.slice(0, 2900), p_area: i.area, p_tela: i.tela, p_onde: null, p_observacoes: (i.obs || '').slice(0, 2900), p_afeta: null }); n++; } catch (e) { } }
        toast(`💡 ${n} sugestão(ões) criadas`); fechar(); Sugestoes.abrir('lista');
      };
    });
  }

  return { abrir, evento, aoMudarTela, retomar, rodarAutomatico, iniciarManual, finalizarManual, mostrarRelatorio, CASOS };
})();
