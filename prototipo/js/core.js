/* Núcleo do protótipo: rotas, armazenamento, ícones, sugestões do professor,
 * agente de atendimento (simulado) e atualização automática do PWA. */
(function () {
  const VERSAO = '0.5.2';

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
  const corAv = (n) => ['#214A68', '#2F7A6B', '#7A4E2F', '#5B3F8C', '#8C3F4E', '#3F5E8C'][n.length % 6];
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

  // confirmação do próprio app (o confirm() do navegador some em app instalado e navegadores embutidos)
  function confirmar(texto, ok = 'Confirmar') {
    if (window.__twSemDialogos) return Promise.resolve(true); // durante o teste automático
    return new Promise((res) => {
      let respondeu = false;
      const bg = modal(`<p style="margin-top:0;font-size:16px">${esc(texto)}</p>
        <button class="btn btn-primary btn-block" id="cf-ok">${esc(ok)}</button>
        <button class="btn btn-block" id="cf-nao" style="margin-top:8px">Cancelar</button>`, (m, fechar) => {
        $('#cf-ok', m).onclick = () => { respondeu = true; fechar(); res(true); };
        $('#cf-nao', m).onclick = () => { respondeu = true; fechar(); res(false); };
      });
      new MutationObserver((_, o) => { if (!bg.isConnected) { o.disconnect(); if (!respondeu) res(false); } }).observe($('#overlays'), { childList: true });
    });
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
      <button class="fab-sug" id="pb-sug" title="Sugestões da equipe"></button><button class="fab-sug pb-testes" id="pb-testes" title="Testes">🧪<span class="pb-lbl"> Testes</span></button>
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
    if (r.area === 'site' && r.sub) setTimeout(() => { const el = document.getElementById(r.sub); el && el.scrollIntoView({ behavior: 'instant', block: 'start' }); }, 0);
    renderFabs();
    marcarSugeridos();
    if (window.Testes && Testes.aoMudarTela) Testes.aoMudarTela();
  }

  // ---------- Ferramentas da equipe de testes (barra amarela) ----------
  // 💡 Sugestões → js/sugestoes.js (lista colaborativa)   🧪 Testes → js/testes.js (automático e manual)
  function telaAtual() {
    const r = rota();
    const nomes = { site: 'Site', app: 'App do aluno', admin: 'Painel do professor' };
    const sec = { inicio: 'Início', agenda: 'Agenda', checkin: 'Check-in', evolucao: 'Evolução', pagamentos: 'Pagamentos', perfil: 'Perfil', notificacoes: 'Avisos', hoje: 'Hoje', presencas: 'Presenças & fotos', alunos: 'Alunos', graduacoes: 'Graduações', financeiro: 'Financeiro', experimentais: 'Aulas experimentais', automacoes: 'Agente & automações', grade: 'Grade & unidades', sobre: 'A escola', unidades: 'Unidades', planos: 'Planos', regras: 'Regras', faq: 'Dúvidas', professores: 'Professores' };
    return (nomes[r.area] || 'Site') + (r.sub ? ' › ' + (sec[r.sub] || r.sub) : '');
  }
  const limpa = (s, n = 70) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

  // "rastro" de um elemento: tela › seção › item tocado + filtros + referência técnica
  function rastroDe(el) {
    const partes = [];
    const root = $('#root');
    for (let a = el; a && a !== root && a !== document.body; a = a.parentElement) {
      let rot = a.dataset && a.dataset.rotulo;
      if (!rot && a.matches('section')) rot = limpa(($('h2', a) || {}).textContent) || a.id;
      if (!rot && a.matches('.grade-col')) rot = limpa(($('h4', a) || {}).textContent);
      if (!rot && a.matches('.panel, .a-card, .card')) { const h = $('h3', a); if (h && h !== el) rot = limpa(h.textContent, 50); }
      if (!rot && a.matches('.phone')) rot = limpa(($('.app-title', a) || {}).textContent) || 'Tela inicial do app';
      if (rot && !partes.includes(rot)) partes.unshift(rot);
    }
    const proprio = limpa(el.getAttribute('aria-label') || el.getAttribute('alt') || (el.innerText || el.textContent).replace(/\n+/g, ' · ')) || el.tagName.toLowerCase();
    const filtros = $$('.filter.on, .seg button.on, .day.on', root).map((b) => limpa(b.textContent, 30));
    const caminho = [];
    for (let a = el; a && a !== root && caminho.length < 14; a = a.parentElement) {
      const cls = [...a.classList].filter((c) => !['sug-alvo', 'sug-marcado', 'teste-foco'].includes(c)).slice(0, 2).map((c) => '.' + c).join('');
      const idx = a.parentElement ? [...a.parentElement.children].indexOf(a) + 1 : 1;
      caminho.unshift((a.id ? '#' + a.id : a.tagName.toLowerCase() + cls) + `:nth-child(${idx})`);
    }
    return { onde: [telaAtual(), ...partes, `“${proprio}”`].join(' › '), filtros, seletor: caminho.join(' > '), hash: location.hash || '#/' };
  }

  // contorno tracejado nos pontos que já têm sugestão em aberto nesta tela
  let ultimasSug = [];
  function marcarSugeridos(lista) {
    if (lista) ultimasSug = lista;
    $$('.sug-marcado').forEach((e) => e.classList.remove('sug-marcado'));
    ultimasSug.forEach((s) => {
      if (!s.onde || s.situacao === 'Aprovada' || s.onde.hash !== (location.hash || '#/')) return;
      try { const el = document.querySelector('#root > ' + s.onde.seletor); if (el) el.classList.add('sug-marcado'); } catch (e) { }
    });
  }

  function renderFabs() {
    const fab = $('#pb-sug');
    if (fab) {
      const n = ultimasSug.filter((s) => s.situacao !== 'Aprovada').length;
      fab.innerHTML = `${ic('bulb', 16)}<span class="pb-lbl"> Sugestões</span> ${n ? `<span class="n">${n}</span>` : ''}`;
      fab.onclick = () => window.Sugestoes && Sugestoes.abrir();
      const tb = $('#pb-testes'); if (tb) tb.onclick = () => window.Testes && Testes.abrir();
    }
    Agente.fab();
  }

  // modo "toque na parte da tela": devolve o rastro do item tocado (ou null se cancelar)
  function modoMarcar(aoEscolher) {
    document.body.classList.add('marcando');
    const aviso = document.createElement('div');
    aviso.className = 'marcar-aviso';
    aviso.innerHTML = `<span>🎯 <b>Toque na parte da tela</b> que você quer mudar · pode trocar de tela pela barra</span><button>Cancelar</button>`;
    document.body.appendChild(aviso);
    const caixa = document.createElement('div'); caixa.className = 'marcar-caixa'; document.body.appendChild(caixa);
    const alvoDe = (t) => t.closest('#root') && (t.closest('button, a, .slot, .class-item, .kpi, tr, li, .filter, .day, img, h1, h2, h3, p, .card, .a-card, .panel, .presenca, .auto-item, .belt') || t);
    const mover = (e) => {
      const t = alvoDe(e.target); if (!t) { caixa.style.display = 'none'; return; }
      const r = t.getBoundingClientRect();
      Object.assign(caixa.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
    };
    const sair = () => {
      document.body.classList.remove('marcando'); aviso.remove(); caixa.remove();
      document.removeEventListener('pointermove', mover, true); document.removeEventListener('click', clicar, true); document.removeEventListener('keydown', esc_, true);
    };
    const clicar = (e) => {
      if (aviso.contains(e.target)) { e.preventDefault(); sair(); aoEscolher(null); return; }
      const t = alvoDe(e.target); if (!t) return;
      e.preventDefault(); e.stopPropagation();
      const alvo = rastroDe(t);
      sair();
      $$('.sug-alvo').forEach((x) => x.classList.remove('sug-alvo'));
      t.classList.add('sug-alvo');
      aoEscolher(alvo);
    };
    const esc_ = (e) => { if (e.key === 'Escape') { sair(); aoEscolher(null); } };
    document.addEventListener('pointermove', mover, true);
    document.addEventListener('click', clicar, true);
    document.addEventListener('keydown', esc_, true);
  }

  // ---------- Registro de ações e erros (alimenta o teste manual e os relatórios) ----------
  function registrar(tipo, msg, extra) {
    const item = { em: new Date().toISOString(), tipo, msg: String(msg).slice(0, 400), tela: location.hash || '#/', ...(extra || {}) };
    const l = store.get('registro', []); l.push(item); store.set('registro', l.slice(-150));
    if (window.Testes && Testes.evento) Testes.evento(item);
  }
  window.addEventListener('error', (e) => registrar('erro', e.message || 'Erro', { arquivo: (e.filename || '').split('/').pop(), linha: e.lineno, coluna: e.colno, pilha: e.error && e.error.stack ? String(e.error.stack).slice(0, 600) : '' }));
  window.addEventListener('unhandledrejection', (e) => registrar('erro', 'Falha em operação: ' + ((e.reason && e.reason.message) || e.reason), { pilha: e.reason && e.reason.stack ? String(e.reason.stack).slice(0, 600) : '' }));

  function aparelho() {
    const ua = navigator.userAgent;
    const so = /iphone|ipad/i.test(ua) ? 'iPhone/iPad' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'Mac' : 'Outro';
    const nav = /edg\//i.test(ua) ? 'Edge' : /crios|chrome/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : /firefox/i.test(ua) ? 'Firefox' : 'Navegador';
    const inst = document.body.classList.contains('standalone') ? 'app instalado' : 'navegador';
    return `v${VERSAO} · ${so} · ${nav} · tela ${innerWidth}x${innerHeight} · ${inst}`;
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
        store.set('experimentais', exp); registrar('acao', 'Aula experimental agendada pelo agente');
        return this.bot(`✅ Aula experimental AGENDADA!\n\n📅 ${this.dados.horario}\n📍 ${this.dados.unidade.nome} — ${this.dados.unidade.endereco}\n🥋 Leve roupa confortável (bermuda e camiseta). Kimono não é obrigatório na 1ª aula.\n\nVocê vai receber um lembrete no WhatsApp 2h antes. O professor já foi avisado no painel. Oss!`, ['Ver no painel do professor', 'Valores']);
      }
      if (t.includes('painel')) { location.hash = '#/admin/experimentais'; this.toggle(false); return; }
      if (t.includes('experimental') || t.includes('agendar') || t.includes('aula grátis')) { this.passo = 'nome'; return this.bot('Bora treinar! 💪 A primeira aula é por nossa conta.\nQual é o seu nome?'); }
      if (t.includes('hor') || t.includes('grade')) {
        const hoje = new Date().getDay() || 1;
        const l = DB.grade.filter((g) => g.dia === hoje).map((g) => `• ${g.hora} — ${g.turma} (${unidade(g.unidade).nome})`).join('\n');
        return this.bot(`Hoje (${DIAS_LONGO[hoje]}):\n${l || 'sem aulas'}\n\nA grade completa está no site, filtrando por unidade.`, ['Aula experimental', 'Valores']);
      }
      if (t.includes('valor') || t.includes('preço') || t.includes('preco') || t.includes('plano') || t.includes('quanto')) return this.bot(`Adulto: ${brl(DB.precos.adulto)}/mês com treinos ilimitados.\nFilho de aluno: ${brl(DB.precos.dependente)}/mês.\nOutros planos (infantil, avulsa): a confirmar.\nPagamento por Pix direto no app, com confirmação automática.`, ['Aula experimental', 'Onde fica?']);
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
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (instalado) return toast('O app já está instalado e aberto 👍');
    modal(`<h3>${ic('download')} Instalar o app The Way</h3>
      ${ios ? `<p><b>No iPhone (Safari):</b></p><ol><li>Toque em <b>Compartilhar</b> (quadrado com seta ↑)</li><li>Escolha <b>“Adicionar à Tela de Início”</b></li><li>Toque em <b>Adicionar</b></li></ol>`
        : android ? `<p><b>No Android (Chrome):</b></p><ol><li>Toque no menu <b>⋮</b></li><li>Escolha <b>“Instalar app”</b> ou “Adicionar à tela inicial”</li></ol>`
        : `<p><b>No computador (Chrome ou Edge):</b></p><ol><li>Na barra de endereço, clique no ícone <b>Instalar</b> (monitor com seta ↓), à direita</li><li>Ou abra o menu <b>⋮</b> → <b>“Transmitir, salvar e compartilhar” → “Instalar página como app”</b> (no Edge: <b>Aplicativos → Instalar este site como um aplicativo</b>)</li></ol>`}
      <p class="a-muted">O ícone da The Way aparece junto com os outros apps. Toda atualização chega sozinha — não precisa reinstalar.</p>
      <button class="btn btn-primary btn-block" data-close>Entendi</button>`);
  }

  function start() {
    pwa();
    window.addEventListener('hashchange', render);
    render();
    fotoCompartilhada();
    if (window.Testes) Testes.retomar();
    // carrega as sugestões em segundo plano (contador na barra + contorno nos pontos já sugeridos)
    if (window.Sugestoes && window.Equipe && (!Equipe.compartilhado || Equipe.eu().codigo)) Sugestoes.carregar(true).then(() => renderFabs());
  }

  // Foto que o professor compartilhou do WhatsApp para o app (ver share_target no manifest e sw.js)
  async function fotoCompartilhada() {
    if (new URLSearchParams(location.search).get('foto') !== 'compartilhada' || !('caches' in window)) return;
    history.replaceState(null, '', location.pathname + location.hash);
    try {
      const c = await caches.open('theway-compartilhada');
      const r = await c.match('./_foto-compartilhada');
      if (!r) return;
      const blob = await r.blob(); await c.delete('./_foto-compartilhada');
      Admin.abrirFotoTurma(new File([blob], 'foto-turma.jpg', { type: blob.type || 'image/jpeg' }));
    } catch (e) { toast('Não consegui abrir a foto compartilhada'); }
  }

  window.App = { start, render, rota, telaAtual, rastroDe, modoMarcar, marcarSugeridos, registrar, aparelho, store, ic, $, $$, esc, brl, dataBR, DIAS, DIAS_LONGO, unidade, faixa, iniciais, corAv, logo, toast, modal, confirmar, instalar, Agente, VERSAO };
})();
