/* Central de SUGESTÕES da equipe (colaborativa).
 * Lista única para 3–4 pessoas: cada sugestão tem nº, solicitante, data, área, descrição, situação e histórico.
 * Antes de criar, mostra as parecidas (botão "Eu também quero" em vez de duplicar).
 * Fluxo: Pendente → (Enviar) Enviada → Em análise → Em desenvolvimento → Realizada → Aguardando aprovação → Aprovada
 *                                                                         ↘ Reprovada — necessita de ajuste
 */
window.Sugestoes = (function () {
  const { store, esc, ic, toast, modal, $, $$ } = App;
  const SITUACOES = ['Pendente', 'Enviada', 'Em análise', 'Em desenvolvimento', 'Realizada', 'Aguardando aprovação', 'Aprovada', 'Reprovada — necessita de ajuste'];
  const COR = { 'Pendente': '#8A6D00;#FFF4CC', 'Enviada': '#1F5BD6;#E3ECFD', 'Em análise': '#6A3FA0;#EFE7FA', 'Em desenvolvimento': '#0F6E8C;#DFF3F9', 'Realizada': '#1d7a4c;#E7F6EE', 'Aguardando aprovação': '#B45F06;#FDEBD8', 'Aprovada': '#1d7a4c;#D3F2E1', 'Reprovada — necessita de ajuste': '#B42323;#FDE3E3' };
  const AREAS = ['Site', 'App do aluno', 'Painel do professor', 'Reconhecimento facial', 'Pagamentos / Pix', 'Agente / WhatsApp', 'Aula experimental', 'Geral'];
  let lista = [];          // cache da última leitura
  let aba = 'lista', filtro = { situacao: 'abertas', busca: '', minhas: false }, aberto = null, timer = null, ultima = null;
  let alvoNovo = null;     // rastro do "marcar na tela" para a nova sugestão

  const num = (id) => '#' + String(id).padStart(3, '0');
  const dh = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const chip = (s) => { const [c, bg] = (COR[s] || '#333;#eee').split(';'); return `<span class="sit" style="color:${c};background:${bg}">${esc(s)}</span>`; };
  const ehMinha = (s) => s.solicitante.toLowerCase() === (Equipe.eu().nome || '').toLowerCase();
  const areaDaTela = () => { const r = location.hash; return r.startsWith('#/app') ? 'App do aluno' : r.startsWith('#/admin') ? 'Painel do professor' : 'Site'; };

  // ---------- parecidas (evita duplicar) ----------
  const PARADAS = new Set('para com uma umas uns que dos das nos nas pelo pela mais muito esta este essa esse isso aqui tela quero colocar mudar trocar ficar fazer seria poderia tambem também'.split(' '));
  const palavras = (t) => new Set((t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !PARADAS.has(w)));
  function parecidas(texto, alvo) {
    const a = palavras(texto); if (a.size < 2 && !alvo) return [];
    return lista.filter((s) => s.situacao !== 'Aprovada').map((s) => {
      const b = palavras(s.descricao + ' ' + (s.onde && s.onde.onde || ''));
      let inter = 0; a.forEach((w) => b.has(w) && inter++);
      let nota = a.size ? inter / Math.min(a.size, b.size || 1) : 0;
      if (alvo && s.onde && s.onde.seletor && s.onde.seletor === alvo.seletor) nota += 0.5;
      return { s, nota };
    }).filter((x) => x.nota >= 0.4).sort((x, y) => y.nota - x.nota).slice(0, 3).map((x) => x.s);
  }
  const aprovadaNoMesmoLugar = (alvo) => alvo && lista.find((s) => s.situacao === 'Aprovada' && s.onde && (s.onde.seletor === alvo.seletor || (s.onde.hash === alvo.hash && s.onde.onde === alvo.onde)));

  // ---------- dados ----------
  async function carregar(silencioso) {
    try { lista = await Equipe.chamar('tw_sug_listar'); ultima = new Date(); App.marcarSugeridos(lista); return lista; }
    catch (e) { if (!silencioso) toast('⚠️ ' + e.message, 4000); App.registrar('erro', 'Sugestões: ' + e.message); return lista; }
  }

  // migra as sugestões da versão anterior (só neste aparelho) para a nova lista
  async function migrarAntigas(nome) {
    if (store.get('sug-migrado', false)) return;
    const atuais = store.get('sugestoes', []), enviadas = store.get('sug-enviadas', []);
    const todas = [...enviadas.flatMap((l) => l.itens.map((i) => ({ ...i, enviada: true }))), ...atuais.map((i) => ({ ...i, enviada: false }))];
    for (const i of todas) {
      try {
        await Equipe.chamar('tw_sug_criar', { p_solicitante: nome, p_descricao: i.texto, p_area: (i.tela || '').split(' › ')[0] || 'Geral', p_tela: i.tela || '', p_onde: i.alvo || null, p_observacoes: '(trazida da versão anterior)', p_afeta: null });
      } catch (e) { /* ignora item inválido */ }
    }
    if (todas.some((i) => i.enviada)) await Equipe.chamar('tw_sug_enviar', { p_nome: nome }).catch(() => {});
    store.set('sug-migrado', true);
    if (todas.length) toast(`${todas.length} sugestão(ões) da versão anterior trazidas para a nova lista`, 3500);
  }

  // ---------- painel ----------
  async function abrir(irPara) {
    const e = await Equipe.identificar();
    await migrarAntigas(e.nome);
    if (irPara) { aba = irPara; aberto = null; }
    let p = $('#central-sug');
    if (!p) {
      p = document.createElement('aside'); p.id = 'central-sug'; p.className = 'central';
      p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Sugestões da equipe');
      document.body.appendChild(p);
    }
    document.body.classList.add('central-aberta');
    p.innerHTML = `<div class="central-load">Carregando sugestões…</div>`;
    await carregar();
    desenhar();
    clearInterval(timer);
    timer = setInterval(async () => { if (document.visibilityState === 'visible' && $('#central-sug') && !temEdicaoAtiva()) { await carregar(true); desenhar(true); } }, 10000);
  }
  const temEdicaoAtiva = () => { const a = document.activeElement; return a && $('#central-sug') && $('#central-sug').contains(a) && /TEXTAREA|INPUT|SELECT/.test(a.tagName); };
  function fechar() { clearInterval(timer); aberto = null; const p = $('#central-sug'); p && p.remove(); document.body.classList.remove('central-aberta'); App.marcarSugeridos(lista); }

  function contagem() {
    const eu = Equipe.eu();
    return {
      abertas: lista.filter((s) => s.situacao !== 'Aprovada').length,
      aprovar: lista.filter((s) => s.situacao === 'Aguardando aprovação' && (ehMinha(s) || eu.admin)).length,
      aprovadas: lista.filter((s) => s.situacao === 'Aprovada').length,
      minhasPend: lista.filter((s) => s.situacao === 'Pendente' && ehMinha(s)).length
    };
  }

  function desenhar(manterScroll) {
    const p = $('#central-sug'); if (!p) return;
    const corpo = $('.central-corpo', p); const scroll = manterScroll && corpo ? corpo.scrollTop : 0;
    const eu = Equipe.eu(); const c = contagem();
    p.innerHTML = `
      <header class="central-top">
        <div style="flex:1;min-width:0"><b>💡 Sugestões da equipe</b>
          <small>${Equipe.compartilhado ? '🟢 Lista compartilhada' : '🟡 Modo local (só este aparelho)'} · ${ultima ? 'atualizado ' + ultima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</small></div>
        <button class="c-who" id="c-who" title="Trocar nome">${eu.admin ? '🔑 ' : '👤 '}${esc(eu.nome)}</button>
        <button class="c-x" id="c-x" aria-label="Fechar">✕</button>
      </header>
      <nav class="central-abas">
        ${[['lista', `Lista (${c.abertas})`], ['nova', '＋ Nova'], ['aprovar', `Para aprovar${c.aprovar ? ` <span class="badge">${c.aprovar}</span>` : ''}`], ['aprovadas', `✅ Aprovadas (${c.aprovadas})`]]
          .map(([k, n]) => `<button class="${aba === k ? 'on' : ''}" data-aba="${k}">${n}</button>`).join('')}
      </nav>
      <div class="central-corpo">${aberto ? detalhe(lista.find((s) => s.id === aberto)) : aba === 'nova' ? nova() : tabela()}</div>
      ${!aberto && aba === 'lista' ? `<footer class="central-rodape">
        <button class="btn btn-ok btn-block" id="c-enviar" ${c.minhasPend ? '' : 'disabled'}>📤 Enviar minhas sugestões${c.minhasPend ? ` (${c.minhasPend} pendente${c.minhasPend > 1 ? 's' : ''})` : ''}</button>
        <div class="a-row" style="gap:8px;margin-top:6px">
          <button class="btn btn-ghost btn-sm" style="flex:1" id="c-zap">${ic('whats', 16)} Resumo no WhatsApp</button>
          <button class="btn btn-ghost btn-sm" style="flex:1" id="c-adm">${eu.admin ? 'Sair do modo admin' : '🔑 Sou o administrador'}</button>
        </div></footer>` : ''}`;
    ligar(p);
    const nc = $('.central-corpo', p); if (nc && scroll) nc.scrollTop = scroll;
  }

  function filtrar() {
    let l = lista.slice();
    if (aba === 'aprovadas') l = l.filter((s) => s.situacao === 'Aprovada');
    else if (aba === 'aprovar') l = l.filter((s) => s.situacao === 'Aguardando aprovação' && (ehMinha(s) || Equipe.eu().admin));
    else {
      l = l.filter((s) => s.situacao !== 'Aprovada');
      if (filtro.situacao !== 'abertas') l = l.filter((s) => s.situacao === filtro.situacao);
      if (filtro.minhas) l = l.filter(ehMinha);
    }
    if (filtro.busca) { const b = filtro.busca.toLowerCase(); l = l.filter((s) => (num(s.id) + s.solicitante + s.descricao + s.area + (s.onde && s.onde.onde || '')).toLowerCase().includes(b)); }
    return l.sort((a, b) => b.id - a.id);
  }

  function tabela() {
    const l = filtrar();
    const vazio = { lista: 'Nenhuma sugestão ainda. Toque em “＋ Nova”.', aprovar: 'Nada aguardando a sua aprovação. 🎉', aprovadas: 'Nenhuma sugestão aprovada ainda.' }[aba];
    return `
      ${aba === 'aprovar' ? `<p class="dica">Estas sugestões já foram feitas. <b>Confira na tela</b> e toque em <b>Aprovar</b> ou <b>Pedir ajuste</b>.</p>` : ''}
      ${aba === 'aprovadas' ? `<p class="dica">Sugestões conferidas e aprovadas. Ficam <b>travadas</b>: não podem ser alteradas sem autorização do administrador.</p>` : ''}
      <div class="c-filtros">
        <input id="c-busca" placeholder="🔍 Buscar nº, nome ou palavra" value="${esc(filtro.busca)}">
        ${aba === 'lista' ? `<select id="c-sit"><option value="abertas">Todas em aberto</option>${SITUACOES.filter((s) => s !== 'Aprovada').map((s) => `<option ${filtro.situacao === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <label class="c-minhas"><input type="checkbox" id="c-minhas" ${filtro.minhas ? 'checked' : ''}> Só as minhas</label>` : ''}
      </div>
      ${l.length ? `<div class="c-tab">
        <div class="c-tr c-th"><span>Nº</span><span>Solicitante</span><span>Sugestão</span><span>Situação</span></div>
        ${l.map((s) => `<button class="c-tr" data-abrir="${s.id}">
          <span class="c-num">${num(s.id)}</span>
          <span class="c-sol">${esc(s.solicitante)}<small>${dh(s.criado_em)}</small></span>
          <span class="c-desc">${esc(s.descricao)}<small>${esc(s.area)}${s.onde ? ' · 📍 ' + esc(s.onde.onde).slice(0, 60) : ''}${s.apoios.length ? ` · 👍 ${s.apoios.length}` : ''}${s.afeta_aprovada ? ` · ⚠️ mexe na ${num(s.afeta_aprovada)} aprovada` : ''}</small></span>
          <span>${chip(s.situacao)}</span>
        </button>`).join('')}</div>` : `<p class="vazio">${vazio}</p>`}`;
  }

  function nova() {
    const r = store.get('sug-rascunho2', {});
    const alvo = alvoNovo || r.alvo || null;
    const trava = aprovadaNoMesmoLugar(alvo);
    return `
      <p class="dica">1) Se quiser, <b>marque na tela</b> onde é. 2) Descreva. 3) Veja se alguém já pediu algo parecido. Tudo é salvo enquanto você digita.</p>
      <button class="btn btn-block marcar-btn" id="n-marcar">🎯 ${alvo ? 'Trocar o local marcado' : 'Marcar na tela o que quer mudar'}</button>
      ${alvo ? `<div class="rastro"><small>📍 Local marcado</small><b>${esc(alvo.onde)}</b>${alvo.filtros && alvo.filtros.length ? `<small>Filtros: ${esc(alvo.filtros.join(', '))}</small>` : ''}<button id="n-tirar">tirar marcação</button></div>` : ''}
      ${trava ? `<div class="aviso-trava">🔒 Este ponto já foi <b>aprovado</b> na sugestão ${num(trava.id)} (${esc(trava.aprovada_por || '')}, ${dh(trava.aprovada_em)}). Uma nova mudança aqui fica marcada para o administrador autorizar.</div>` : ''}
      <label for="n-area">Área</label>
      <select id="n-area">${AREAS.map((a) => `<option ${(r.area || areaDaTela()) === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
      <label for="n-desc">O que você sugere?</label>
      <textarea id="n-desc" rows="4" maxlength="3000" placeholder="Ex.: incluir horário na terça às 7h na Hammer BSB">${esc(r.descricao || '')}</textarea>
      <div id="n-parecidas"></div>
      <label for="n-obs">Observações (opcional)</label>
      <textarea id="n-obs" rows="2" maxlength="3000" placeholder="Detalhes, exemplos, prioridade…">${esc(r.observacoes || '')}</textarea>
      <div class="a-row" style="justify-content:space-between;margin:4px 0 10px"><small class="a-muted" id="n-salvo">${r.descricao ? '✓ rascunho salvo' : ''}</small></div>
      <button class="btn btn-primary btn-block" id="n-salvar">Salvar sugestão</button>`;
  }

  function detalhe(s) {
    if (!s) { aberto = null; return tabela(); }
    const eu = Equipe.eu(); const minha = ehMinha(s);
    const podeEditar = (minha || eu.admin) && s.situacao !== 'Aprovada';
    return `
      <button class="c-voltar" id="d-voltar">← Voltar para a lista</button>
      <div class="d-cab"><span class="c-num" style="font-size:20px">${num(s.id)}</span>${chip(s.situacao)}</div>
      <dl class="d-info">
        <dt>Solicitante</dt><dd>${esc(s.solicitante)}${s.apoios.length ? ` <small>· 👍 também querem: ${esc(s.apoios.join(', '))}</small>` : ''}</dd>
        <dt>Data</dt><dd>${dh(s.criado_em)}${s.enviada_em ? ` · enviada ${dh(s.enviada_em)} por ${esc(s.enviada_por)}` : ''}</dd>
        <dt>Área</dt><dd>${esc(s.area)}${s.tela ? ' · ' + esc(s.tela) : ''}</dd>
        ${s.onde ? `<dt>Onde</dt><dd>📍 ${esc(s.onde.onde)}${s.onde.filtros && s.onde.filtros.length ? `<br><small>Filtros: ${esc(s.onde.filtros.join(', '))}</small>` : ''}<br><button class="link" id="d-ver">👁 Ver este ponto na tela</button></dd>` : ''}
        ${s.aprovada_em ? `<dt>Aprovada</dt><dd>${dh(s.aprovada_em)} por ${esc(s.aprovada_por)} 🔒</dd>` : ''}
        ${s.afeta_aprovada ? `<dt>Atenção</dt><dd>⚠️ Mexe em algo já aprovado (${num(s.afeta_aprovada)}). Precisa de autorização do administrador.</dd>` : ''}
      </dl>
      <label for="d-desc">Sugestão</label>
      ${podeEditar ? `<textarea id="d-desc" rows="4" maxlength="3000">${esc(s.descricao)}</textarea>` : `<p class="d-txt">${esc(s.descricao)}</p>`}
      <label for="d-obs">Observações</label>
      ${podeEditar ? `<textarea id="d-obs" rows="2" maxlength="3000">${esc(s.observacoes)}</textarea>` : `<p class="d-txt">${esc(s.observacoes || '—')}</p>`}
      ${podeEditar ? `<small class="a-muted" id="d-salvo">Alterações salvas automaticamente</small>` : ''}

      ${s.situacao === 'Aguardando aprovação' && (minha || eu.admin) ? `
        <div class="d-aprovar"><b>Esta sugestão foi feita. Confira na tela:</b>
          <textarea id="d-nota" rows="2" placeholder="Comentário (obrigatório para pedir ajuste)"></textarea>
          <div class="a-row" style="gap:8px"><button class="btn btn-ok" style="flex:1" id="d-ok">👍 Aprovar</button><button class="btn btn-ghost" style="flex:1;color:#B42323;border-color:#F3C2C2" id="d-nao">✋ Pedir ajuste</button></div></div>` : ''}

      ${!minha && s.situacao !== 'Aprovada' && !s.apoios.includes(eu.nome) ? `<button class="btn btn-ghost btn-block" id="d-apoiar" style="margin-top:10px">👍 Eu também quero isso</button>` : ''}

      ${eu.admin ? `<div class="d-admin"><b>🔑 Administrador</b>
        <label for="d-sit">Mudar situação</label>
        <select id="d-sit">${SITUACOES.map((x) => `<option ${x === s.situacao ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <textarea id="d-anota" rows="2" placeholder="Nota (opcional) — ex.: o que foi feito"></textarea>
        <div class="a-row" style="gap:8px"><button class="btn btn-primary" style="flex:2" id="d-sit-ok">Salvar situação</button><button class="btn btn-ghost" style="flex:1;color:#B42323" id="d-excluir">Excluir</button></div>
        <small class="a-muted">“Realizada” já libera para o solicitante conferir e aprovar.</small></div>` : ''}

      <div class="a-section-title">Histórico</div>
      <ol class="d-hist">${s.historico.slice().reverse().map((h) => `<li><small>${dh(h.em)} · ${esc(h.por || '')}</small>${h.de ? `${esc(h.de)} → ` : ''}<b>${esc(h.para)}</b>${h.nota ? `<br><i>“${esc(h.nota)}”</i>` : ''}</li>`).join('')}</ol>`;
  }

  // ---------- eventos ----------
  function ligar(p) {
    $('#c-x', p).onclick = fechar;
    $('#c-who', p).onclick = async () => { await Equipe.trocarNome(); desenhar(); };
    $$('[data-aba]', p).forEach((b) => b.onclick = () => { aba = b.dataset.aba; aberto = null; desenhar(); });
    $$('[data-abrir]', p).forEach((b) => b.onclick = () => { aberto = +b.dataset.abrir; desenhar(); $('.central-corpo', p).scrollTop = 0; });
    const busca = $('#c-busca', p); if (busca) busca.oninput = () => { filtro.busca = busca.value; const pos = busca.selectionStart; desenhar(); const nb = $('#c-busca'); nb.focus(); nb.setSelectionRange(pos, pos); };
    const sit = $('#c-sit', p); if (sit) sit.onchange = () => { filtro.situacao = sit.value; desenhar(); };
    const mi = $('#c-minhas', p); if (mi) mi.onchange = () => { filtro.minhas = mi.checked; desenhar(); };
    const env = $('#c-enviar', p); if (env) env.onclick = enviar;
    const zap = $('#c-zap', p); if (zap) zap.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(resumoTexto()), '_blank', 'noopener');
    const adm = $('#c-adm', p); if (adm) adm.onclick = admin;
    if (aberto) ligarDetalhe(p); else if (aba === 'nova') ligarNova(p);
  }

  function ligarNova(p) {
    const salvarRasc = () => {
      store.set('sug-rascunho2', { ...store.get('sug-rascunho2', {}), alvo: alvoNovo || store.get('sug-rascunho2', {}).alvo || null, area: $('#n-area', p).value, descricao: $('#n-desc', p).value, observacoes: $('#n-obs', p).value });
      $('#n-salvo', p).textContent = '✓ rascunho salvo';
      mostrarParecidas();
    };
    const mostrarParecidas = () => {
      const r = store.get('sug-rascunho2', {});
      const l = parecidas($('#n-desc', p).value, alvoNovo || r.alvo);
      $('#n-parecidas', p).innerHTML = l.length ? `<div class="parecidas"><b>🔎 Parecidas já cadastradas</b> — se for a mesma, apoie em vez de criar outra:
        ${l.map((s) => `<div class="par-item"><div style="flex:1;min-width:0"><small>${num(s.id)} · ${esc(s.solicitante)} · ${chip(s.situacao)}</small>${esc(s.descricao)}</div>
        ${ehMinha(s) ? '<small class="a-muted">é sua</small>' : `<button class="btn btn-ghost btn-sm" data-apoiar="${s.id}">👍 É a mesma</button>`}</div>`).join('')}</div>` : '';
      $$('[data-apoiar]', p).forEach((b) => b.onclick = async () => {
        try { await Equipe.chamar('tw_sug_apoiar', { p_id: +b.dataset.apoiar, p_nome: Equipe.eu().nome }); store.set('sug-rascunho2', {}); alvoNovo = null;
          App.registrar('acao', `Apoiou a sugestão ${num(b.dataset.apoiar)}`); toast('👍 Apoio registrado — não foi criada uma duplicada'); await carregar(); aba = 'lista'; aberto = +b.dataset.apoiar; desenhar(); }
        catch (e) { toast('⚠️ ' + e.message); }
      });
    };
    ['#n-area', '#n-desc', '#n-obs'].forEach((s) => $(s, p).addEventListener('input', salvarRasc));
    $('#n-area', p).addEventListener('change', salvarRasc);
    mostrarParecidas();
    $('#n-marcar', p).onclick = () => {
      salvarRasc(); p.style.display = 'none'; document.body.classList.remove('central-aberta');
      App.modoMarcar((alvo) => {
        p.style.display = ''; document.body.classList.add('central-aberta');
        if (alvo) { alvoNovo = alvo; store.set('sug-rascunho2', { ...store.get('sug-rascunho2', {}), alvo }); }
        desenhar();
      });
    };
    const ti = $('#n-tirar', p); if (ti) ti.onclick = () => { alvoNovo = null; store.set('sug-rascunho2', { ...store.get('sug-rascunho2', {}), alvo: null }); $$('.sug-alvo').forEach((x) => x.classList.remove('sug-alvo')); desenhar(); };
    $('#n-salvar', p).onclick = async () => {
      const d = $('#n-desc', p).value.trim(); if (d.length < 3) { toast('Descreva a sugestão'); return $('#n-desc', p).focus(); }
      const r = store.get('sug-rascunho2', {}); const alvo = alvoNovo || r.alvo || null; const trava = aprovadaNoMesmoLugar(alvo);
      const bt = $('#n-salvar', p); bt.disabled = true; bt.textContent = 'Salvando…';
      try {
        const s = await Equipe.chamar('tw_sug_criar', { p_solicitante: Equipe.eu().nome, p_descricao: d, p_area: $('#n-area', p).value, p_tela: alvo ? App.telaAtual() : '', p_onde: alvo, p_observacoes: $('#n-obs', p).value.trim(), p_afeta: trava ? trava.id : null });
        store.set('sug-rascunho2', {}); alvoNovo = null; $$('.sug-alvo').forEach((x) => x.classList.remove('sug-alvo'));
        App.registrar('acao', `Sugestão ${num(s.id)} cadastrada`);
        toast(`✅ Sugestão ${num(s.id)} salva. Quando terminar, toque em “Enviar minhas sugestões”.`, 4000);
        await carregar(); desenhar();
      } catch (e) { toast('⚠️ ' + e.message, 4000); App.registrar('erro', 'Salvar sugestão: ' + e.message); bt.disabled = false; bt.textContent = 'Salvar sugestão'; }
    };
  }

  function ligarDetalhe(p) {
    const s = lista.find((x) => x.id === aberto); if (!s) return;
    $('#d-voltar', p).onclick = () => { aberto = null; desenhar(); };
    const ver = $('#d-ver', p);
    if (ver) ver.onclick = () => {
      fechar(); if (location.hash !== s.onde.hash) location.hash = s.onde.hash;
      setTimeout(() => { try { const el = document.querySelector('#root > ' + s.onde.seletor); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('sug-alvo'); setTimeout(() => el.classList.remove('sug-alvo'), 4000); } else toast('Não achei esse ponto — a tela pode ter mudado'); } catch (e) { } }, 400);
    };
    // edição com salvamento automático (1 s depois de parar de digitar)
    let t;
    const autoSalvar = () => {
      clearTimeout(t); $('#d-salvo', p).textContent = 'digitando…';
      t = setTimeout(async () => {
        try { await Equipe.chamar('tw_sug_editar', { p_id: s.id, p_nome: Equipe.eu().nome, p_descricao: $('#d-desc', p).value, p_observacoes: $('#d-obs', p).value, p_area: null });
          $('#d-salvo', p).textContent = '✓ salvo ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); await carregar(true); }
        catch (e) { $('#d-salvo', p).textContent = '⚠️ ' + e.message; }
      }, 1000);
    };
    ['#d-desc', '#d-obs'].forEach((sel) => { const el = $(sel, p); if (el) el.oninput = autoSalvar; });
    const ok = $('#d-ok', p), nao = $('#d-nao', p);
    const decidir = async (aprovado) => {
      try { await Equipe.chamar('tw_sug_aprovar', { p_id: s.id, p_nome: Equipe.eu().nome, p_aprovado: aprovado, p_nota: $('#d-nota', p).value.trim() });
        App.registrar('acao', `Sugestão ${num(s.id)} ${aprovado ? 'aprovada' : 'devolvida para ajuste'}`);
        toast(aprovado ? `✅ ${num(s.id)} aprovada e movida para “Aprovadas”` : `✋ ${num(s.id)} devolvida para ajuste`, 3500); await carregar(); desenhar(); }
      catch (e) { toast('⚠️ ' + e.message, 4000); }
    };
    if (ok) ok.onclick = () => decidir(true);
    if (nao) nao.onclick = () => decidir(false);
    const ap = $('#d-apoiar', p);
    if (ap) ap.onclick = async () => { try { await Equipe.chamar('tw_sug_apoiar', { p_id: s.id, p_nome: Equipe.eu().nome }); toast('👍 Apoio registrado'); await carregar(); desenhar(); } catch (e) { toast('⚠️ ' + e.message); } };
    const so = $('#d-sit-ok', p);
    if (so) so.onclick = async () => {
      try { await Equipe.chamar('tw_sug_status', { p_id: s.id, p_situacao: $('#d-sit', p).value, p_nota: $('#d-anota', p).value.trim(), p_por: Equipe.eu().nome });
        App.registrar('acao', `Admin: ${num(s.id)} → ${$('#d-sit', p).value}`); toast('Situação atualizada'); await carregar(); desenhar(); }
      catch (e) { toast('⚠️ ' + e.message, 4000); }
    };
    const ex = $('#d-excluir', p);
    if (ex) ex.onclick = async () => { if (!(await App.confirmar(`Excluir a sugestão ${num(s.id)}? (use para duplicadas)`, 'Excluir'))) return; try { await Equipe.chamar('tw_sug_excluir', { p_id: s.id }); aberto = null; await carregar(); desenhar(); toast('Excluída'); } catch (e) { toast('⚠️ ' + e.message); } };
  }

  async function enviar() {
    const eu = Equipe.eu(); const pend = lista.filter((s) => s.situacao === 'Pendente' && ehMinha(s));
    if (!pend.length) return;
    const local = !Equipe.compartilhado;
    // confirmação do próprio app (o confirm() do navegador é bloqueado em app instalado / navegadores embutidos)
    modal(`<h3>📤 Enviar ${pend.length} sugestão${pend.length > 1 ? 'ões' : ''}?</h3>
      <p class="a-muted" style="margin-top:0">Elas passam para <b>“Enviada”</b>, ficam registradas com seu nome, data e hora, e o Wesley acompanha a partir daí.</p>
      ${local ? '<p class="a-muted" style="font-size:13px">Como a lista ainda não é compartilhada, o <b>WhatsApp</b> abre com o texto pronto. É só escolher o Wesley (ou o grupo) e mandar.</p>' : ''}
      <button class="btn btn-ok btn-block" id="env-ok">${local ? '📤 Enviar e abrir o WhatsApp' : '📤 Enviar'}</button>
      <button class="btn btn-block" data-close style="margin-top:8px">Cancelar</button>`, (m, fechar) => {
      $('#env-ok', m).onclick = async () => {
        // o WhatsApp precisa abrir NO TOQUE (depois de esperar, o celular bloqueia como pop-up)
        if (local) {
          const ids = pend.map((s) => s.id);
          const txt = resumoTexto(ids).replace(/· Pendente\*/g, '· Enviada*');
          window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
        }
        fechar();
        try {
          const q = await Equipe.chamar('tw_sug_enviar', { p_nome: eu.nome });
          App.registrar('acao', `${q} sugestão(ões) enviadas`);
          await carregar(); desenhar();
          toast(local ? `📤 ${q} enviada${q > 1 ? 's' : ''}. Mande a mensagem no WhatsApp que abriu.` : `📤 ${q} sugestão(ões) enviadas. O Wesley já vê na lista.`, 5000);
        } catch (e) { toast('⚠️ ' + e.message, 4000); }
      };
    });
  }

  function resumoTexto(ids) {
    const l = (ids ? lista.filter((s) => ids.includes(s.id)) : filtrar());
    return `*Sugestões — protótipo The Way* (${l.length})\nEnviado por ${Equipe.eu().nome} em ${dh(new Date().toISOString())}\n\n` + l.map((s) =>
      `*${num(s.id)} · ${s.situacao}*\n👤 ${s.solicitante} · ${s.area}\n` + (s.onde ? `📍 ${s.onde.onde}\n` : '') + `✏️ ${s.descricao}\n` + (s.observacoes ? `📝 ${s.observacoes}\n` : '') + (s.onde ? `🧭 ${s.onde.hash} | ${s.onde.seletor}\n` : '')
    ).join('\n') + `\n—\n🛠 ${App.aparelho()}`;
  }

  function admin() {
    if (Equipe.eu().admin) { Equipe.sairAdmin(); toast('Saiu do modo administrador'); return desenhar(); }
    modal(`<h3>🔑 Administrador</h3><p class="a-muted" style="margin-top:0">Só o Wesley tem esse código. Com ele dá para mudar a situação das sugestões e ver todos os relatórios.</p>
      ${Equipe.compartilhado ? '' : '<p class="a-muted" style="font-size:12px">Modo local (demonstração): o código é <b>wesley</b>.</p>'}
      <input id="adm-cod" type="password" placeholder="Código do administrador" autocomplete="off">
      <p id="adm-erro" style="color:#B42323;font-size:14px;margin:0 0 8px"></p>
      <button class="btn btn-primary btn-block" id="adm-ok">Entrar</button>`, (m, f) => {
      $('#adm-ok', m).onclick = async () => { try { await Equipe.entrarAdmin($('#adm-cod', m).value.trim()); f(); toast('🔑 Modo administrador'); desenhar(); } catch (e) { $('#adm-erro', m).textContent = e.message; } };
    });
  }

  return { abrir, fechar, carregar, num, lista: () => lista, SITUACOES };
})();
