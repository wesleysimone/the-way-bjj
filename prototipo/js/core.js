/* Núcleo do protótipo: rotas, armazenamento, ícones, sugestões do professor,
 * agente de atendimento (simulado) e atualização automática do PWA. */
(function () {
  const VERSAO = '0.1.0';

  // ---------- armazenamento seguro (localStorage pode falhar em aba anônima) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tw:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tw:' + k, JSON.stringify(v)); } catch (e) { /* sem storage */ } }
  };

  // ---------- ícones (traço, 24px) ----------
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2M7 3h10"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M17 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z"/>',
    send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 13h.01M15 13h.01M9 17h6"/><circle cx="12" cy="3" r="1"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
    chart: '<path d="M3 3v18h18M7 15l4-4 3 3 6-7"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="m8.5 10.5-3-8h4l2.5 5M15.5 10.5l3-8h-4L12 7.5"/>',
    kid: '<circle cx="12" cy="6" r="3"/><path d="M7 21v-6l-2-3 4-2h6l4 2-2 3v6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    whats: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z"/><path d="M8.5 9.5c.5 2.5 3 5 5.5 5.5l1.3-1.3 2 1-.5 1.8c-4 .3-9-4.7-8.7-8.7l1.8-.5 1 2z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'
  };
  const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (v) => v == null ? 'a definir' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataBR = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DIAS_LONGO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const unidade = (id) => DB.unidades.find((u) => u.id === id) || { nome: id };
  const faixa = (id) => [...DB.faixas.adulto, ...DB.faixas.infantil].find((f) => f.id === id);
  const iniciais = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const corAv = (n) => ['#224B66', '#2F7A6B', '#7A4E2F', '#5B3F8C', '#8C3F4E', '#3F5E8C'][n.length % 6];
  const logo = 'assets/icons/logo-256.png';

  function toast(msg, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  function modal(html, onMount) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) bg.remove(); });
    $('#overlays').appendChild(bg);
    onMount && onMount(bg.firstElementChild, () => bg.remove());
    return bg;
  }

  // ---------- rotas ----------
  function rota() {
    const h = location.hash.replace(/^#\/?/, '');
    const [area, sub, extra] = h.split('/');
    return { area: area || 'site', sub: sub || '', extra: extra || '' };
  }

  function protobar(r) {
    const modo = r.area === 'app' ? 'app' : r.area === 'admin' ? 'admin' : 'site';
    $('#protobar').innerHTML = `<div class="pb-inner">
      <span class="pb-tag">⚠ PROTÓTIPO <small>— dados fictícios, para aprovação</small></span>
      <button class="fab-sug" id="pb-sug"></button>
      <nav class="pb-modes" aria-label="Trocar visão">
        <a href="#/" class="${modo === 'site' ? 'on' : ''}">Site</a>
        <a href="#/app/inicio" class="${modo === 'app' ? 'on' : ''}">App do aluno</a>
        <a href="#/admin/hoje" class="${modo === 'admin' ? 'on' : ''}">Painel do professor</a>
      </nav></div>`;
  }

  function alturaBarra() {
    const h = document.body.classList.contains('standalone') ? 0 : $('#protobar').offsetHeight;
    document.documentElement.style.setProperty('--pb-h', h + 'px');
  }
  window.addEventListener('resize', () => alturaBarra());

  function render() {
    const r = rota();
    protobar(r);
    alturaBarra();
    document.body.classList.toggle('route-app', r.area === 'app');
    const root = $('#root');
    if (r.area === 'app') root.innerHTML = Aluno.render(r);
    else if (r.area === 'admin') root.innerHTML = Admin.render(r);
    else root.innerHTML = Site.render(r);
    const mod = r.area === 'app' ? Aluno : r.area === 'admin' ? Admin : Site;
    mod.mount && mod.mount(root, r);
    if (r.area !== 'site' || !r.sub) window.scrollTo({ top: 0, behavior: 'instant' });
    if (r.area === 'site' && r.sub) requestAnimationFrame(() => { const el = document.getElementById(r.sub); el && el.scrollIntoView({ behavior: 'instant', block: 'start' }); });
    renderFabs();
  }

  // ---------- sugestões do professor (o "botão amarelo") ----------
  function telaAtual() {
    const r = rota();
    const nomes = { site: 'Site', app: 'App do aluno', admin: 'Painel do professor' };
    return nomes[r.area] + (r.sub ? ' › ' + r.sub : '');
  }
  function renderFabs() {
    const fab = $('#pb-sug');
    if (fab) {
      const n = store.get('sugestoes', []).length;
      fab.innerHTML = `${ic('bulb', 16)} Sugerir ajuste ${n ? `<span class="n">${n}</span>` : ''}`;
      fab.onclick = abrirSugestoes;
    }
    Agente.fab();
  }
  function abrirSugestoes() {
    const lista = store.get('sugestoes', []);
    modal(`
      <h3>💡 Sugestões para o protótipo</h3>
      <p class="a-muted">Escreva o que mudar, acrescentar ou tirar nesta tela. Pode mandar quantas quiser — no fim, envie todas pelo WhatsApp.</p>
      <label for="sug-txt">Tela: <span style="font-weight:600;color:var(--blue)">${esc(telaAtual())}</span></label>
      <textarea id="sug-txt" rows="3" placeholder="Ex.: colocar o horário de sábado às 9h, trocar a foto do topo, mostrar preço do infantil…"></textarea>
      <button class="btn btn-primary btn-block" id="sug-add">Salvar sugestão</button>
      ${lista.length ? `<div class="a-section-title">Suas sugestões (${lista.length})</div>
      <ul class="sug-list">${lista.map((s, i) => `<li><div><small>${esc(s.tela)}</small>${esc(s.texto)}</div><button data-del="${i}" aria-label="Apagar">✕</button></li>`).join('')}</ul>
      <button class="btn btn-ok btn-block" id="sug-send">${ic('whats', 18)} Enviar todas pelo WhatsApp</button>` : ''}
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fechar</button>
    `, (m, fechar) => {
      $('#sug-add', m).onclick = () => {
        const t = $('#sug-txt', m).value.trim();
        if (!t) return $('#sug-txt', m).focus();
        const l = store.get('sugestoes', []); l.push({ tela: telaAtual(), texto: t, em: new Date().toISOString() });
        store.set('sugestoes', l); fechar(); renderFabs(); toast('Sugestão salva ✓'); abrirSugestoes();
      };
      $$('[data-del]', m).forEach((b) => b.onclick = () => {
        const l = store.get('sugestoes', []); l.splice(+b.dataset.del, 1); store.set('sugestoes', l); fechar(); renderFabs(); abrirSugestoes();
      });
      const s = $('#sug-send', m);
      if (s) s.onclick = () => {
        const l = store.get('sugestoes', []);
        const txt = '*Sugestões — protótipo The Way*\n\n' + l.map((x, i) => `${i + 1}. [${x.tela}] ${x.texto}`).join('\n');
        window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      };
    });
  }

  // ---------- Agente de atendimento (simulação do que a IA fará no WhatsApp/Instagram/site) ----------
  const Agente = {
    aberto: false, passo: null, dados: {},
    fab() {
      if (!$('#chat-fab')) {
        const b = document.createElement('button');
        b.id = 'chat-fab'; b.className = 'chat-fab'; b.setAttribute('aria-label', 'Falar com o assistente The Way');
        b.innerHTML = `<span class="pulse"></span>${ic('chat', 28)}`;
        b.onclick = () => Agente.toggle();
        document.body.appendChild(b);
      }
    },
    toggle(forcar) {
      this.aberto = forcar ?? !this.aberto;
      let c = $('#chat');
      if (!this.aberto) { c && c.remove(); return; }
      if (c) return;
      c = document.createElement('div'); c.id = 'chat'; c.className = 'chat';
      c.innerHTML = `<div class="chat-head"><img src="${logo}" alt=""><div><b>Assistente The Way</b><small>online · responde na hora</small></div><button aria-label="Fechar">×</button></div>
        <div class="chat-body" id="chat-body"></div><div class="quick" id="chat-quick"></div>
        <form class="chat-input" id="chat-form"><input id="chat-in" placeholder="Digite sua mensagem…" autocomplete="off"><button aria-label="Enviar">${ic('send', 18)}</button></form>`;
      document.body.appendChild(c);
      $('.chat-head button', c).onclick = () => this.toggle(false);
      $('#chat-form', c).onsubmit = (e) => { e.preventDefault(); const v = $('#chat-in').value.trim(); if (v) { $('#chat-in').value = ''; this.usuario(v); } };
      this.passo = null; this.dados = {};
      this.bot('Oss! 🥋 Sou o assistente da THE WAY.\nPosso agendar sua aula experimental grátis, passar horários, valores e endereço.', ['Aula experimental', 'Horários', 'Valores', 'Onde fica?', 'Infantil']);
    },
    msg(txt, quem) {
      const b = $('#chat-body'); if (!b) return;
      const m = document.createElement('div'); m.className = 'msg ' + quem; m.textContent = txt;
      b.appendChild(m); b.scrollTop = b.scrollHeight;
    },
    bot(txt, opcoes = []) {
      const b = $('#chat-body'); if (!b) return;
      const t = document.createElement('div'); t.className = 'msg bot typing'; t.textContent = 'digitando…'; b.appendChild(t); b.scrollTop = b.scrollHeight;
      $('#chat-quick').innerHTML = '';
      setTimeout(() => {
        t.remove(); this.msg(txt, 'bot');
        $('#chat-quick').innerHTML = opcoes.map((o) => `<button>${esc(o)}</button>`).join('');
        $$('#chat-quick button').forEach((x) => x.onclick = () => this.usuario(x.textContent));
      }, 650);
    },
    usuario(txt) {
      this.msg(txt, 'me');
      const t = txt.toLowerCase();
      const p = this.passo;
      if (p === 'nome') { this.dados.nome = txt; this.passo = 'publico'; return this.bot(`Prazer, ${txt.split(' ')[0]}! A aula é para você (adulto) ou para uma criança?`, ['Para mim (adulto)', 'Para criança']); }
      if (p === 'publico') { this.dados.publico = t.includes('cria') ? 'infantil' : 'adulto'; this.passo = 'unidade'; return this.bot('Qual unidade fica melhor para você?', DB.unidades.filter((u) => u.status === 'ativa').map((u) => u.nome)); }
      if (p === 'unidade') {
        const u = DB.unidades.find((x) => t.includes(x.nome.toLowerCase().split(' ')[0])) || DB.unidades[0];
        this.dados.unidade = u;
        const op = DB.grade.filter((g) => g.unidade === u.id && g.nivel === this.dados.publico && !/open|livre|drill/i.test(g.turma)).slice(0, 4);
        const ops = (op.length ? op : DB.grade.filter((g) => g.nivel === this.dados.publico).slice(0, 4)).map((g) => `${DIAS[g.dia]} ${g.hora} · ${g.turma}`);
        this.passo = 'horario';
        return this.bot(`Na ${u.nome} tenho estes horários para a primeira aula:`, ops);
      }
      if (p === 'horario') {
        this.dados.horario = txt; this.passo = 'zap';
        return this.bot('Perfeito! Qual o seu WhatsApp? Mando a confirmação, o endereço e um lembrete antes da aula.');
      }
      if (p === 'zap') {
        this.passo = null;
        const exp = store.get('experimentais', []);
        exp.unshift({ nome: this.dados.nome + (this.dados.publico === 'infantil' ? ' (criança)' : ''), idade: this.dados.publico === 'infantil' ? 'Infantil' : 'Adulto', quando: `${this.dados.horario.split(' · ')[0]} · ${this.dados.unidade.nome}`, origem: 'Agente (chat do site)', status: 'confirmado' });
        store.set('experimentais', exp);
        return this.bot(`✅ Aula experimental AGENDADA!\n\n📅 ${this.dados.horario}\n📍 ${this.dados.unidade.nome} — ${this.dados.unidade.endereco}\n🥋 Leve roupa confortável (bermuda e camiseta). Kimono não é obrigatório na 1ª aula.\n\nVocê vai receber um lembrete no WhatsApp 2h antes. O professor já foi avisado no painel. Oss!`, ['Ver no painel do professor', 'Valores']);
      }
      if (t.includes('painel')) { location.hash = '#/admin/experimentais'; this.toggle(false); return; }
      if (t.includes('experimental') || t.includes('agendar') || t.includes('aula grátis')) { this.passo = 'nome'; return this.bot('Bora treinar! 💪 A primeira aula é por nossa conta.\nQual é o seu nome?'); }
      if (t.includes('hor') || t.includes('grade')) {
        const hoje = new Date().getDay() || 1;
        const l = DB.grade.filter((g) => g.dia === hoje).map((g) => `• ${g.hora} — ${g.turma} (${unidade(g.unidade).nome})`).join('\n');
        return this.bot(`Hoje (${DIAS_LONGO[hoje]}):\n${l || 'sem aulas'}\n\nA grade completa está no site, filtrando por unidade.`, ['Aula experimental', 'Valores']);
      }
      if (t.includes('valor') || t.includes('preço') || t.includes('preco') || t.includes('plano') || t.includes('quanto')) return this.bot(`Plano mensal: ${brl(250)} com treinos ilimitados na grade.\nInfantil e Família: valores a confirmar.\nPagamento por Pix direto no app, com confirmação automática.`, ['Aula experimental', 'Onde fica?']);
      if (t.includes('onde') || t.includes('endere') || t.includes('local')) return this.bot(DB.unidades.map((u) => `📍 ${u.nome}: ${u.endereco}`).join('\n'), ['Aula experimental', 'Horários']);
      if (t.includes('infantil') || t.includes('criança') || t.includes('filho')) return this.bot('Temos turmas infantis às 19:15 (seg, qua e sex). Trabalhamos disciplina, coordenação e respeito, com graduação infantil. Quer agendar uma aula experimental para a criança?', ['Aula experimental', 'Valores']);
      return this.bot('Entendi! Na versão real, eu (a IA) respondo qualquer dúvida com base nas informações da escola, e passo para o professor quando precisar. Posso ajudar com:', ['Aula experimental', 'Horários', 'Valores', 'Onde fica?']);
    }
  };

  // ---------- PWA: registro, atualização automática e instalação ----------
  let promptInstalar = null;
  function pwa() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    document.body.classList.toggle('standalone', !!standalone);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalar = e; });
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    let recarregando = false;
    const jaTinhaVersao = !!navigator.serviceWorker.controller; // 1ª visita não precisa recarregar
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando || !jaTinhaVersao) return; recarregando = true;
      store.set('atualizado', true);
      location.reload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      const checar = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checar(); });
      setInterval(checar, 60 * 1000);
    });
    if (store.get('atualizado', false)) { store.set('atualizado', false); setTimeout(() => toast('✨ App atualizado para a versão mais nova'), 600); }
  }
  function instalar() {
    if (promptInstalar) { promptInstalar.prompt(); promptInstalar = null; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    modal(`<h3>${ic('download')} Instalar o app The Way</h3>
      ${ios ? `<p><b>No iPhone (Safari):</b></p><ol><li>Toque em <b>Compartilhar</b> (quadrado com seta ↑)</li><li>Escolha <b>“Adicionar à Tela de Início”</b></li><li>Toque em <b>Adicionar</b></li></ol>`
        : `<p><b>No Android (Chrome):</b></p><ol><li>Toque no menu <b>⋮</b></li><li>Escolha <b>“Instalar app”</b> ou “Adicionar à tela inicial”</li></ol>`}
      <p class="a-muted">O ícone da The Way aparece junto com os outros apps. Toda atualização chega sozinha — não precisa reinstalar.</p>
      <button class="btn btn-primary btn-block" data-close>Entendi</button>`);
  }

  function start() {
    pwa();
    window.addEventListener('hashchange', render);
    render();
  }

  window.App = { start, render, store, ic, $, $$, esc, brl, dataBR, DIAS, DIAS_LONGO, unidade, faixa, iniciais, corAv, logo, toast, modal, instalar, Agente, VERSAO };
})();
