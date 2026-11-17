/* Equipe de testes: identificação (nome + código) e acesso à base de sugestões/relatórios.
 *
 * Dois modos, com a MESMA interface (Nuvem.rpc):
 *  • compartilhado: Supabase (supabase/schema.sql) — todos veem e editam a mesma lista.
 *  • local: mesmas regras, guardado só neste aparelho (enquanto a base não é configurada).
 */
window.Equipe = (function () {
  const { store, esc, modal, toast, $ } = App;
  const CFG = window.THEWAY_CONFIG || {};
  const compartilhado = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const ADMIN_LOCAL = 'wesley'; // só vale no modo local (demonstração)

  // ---------- identidade ----------
  // O link do grupo pode trazer o código: ...?equipe=CODIGO  (guardamos e tiramos da barra de endereço)
  (function capturarCodigoDoLink() {
    const p = new URLSearchParams(location.search);
    const c = p.get('equipe');
    if (c) {
      store.set('equipe-codigo', c.trim());
      p.delete('equipe');
      const q = p.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }
  })();

  const eu = () => ({
    nome: store.get('equipe-nome', ''),
    codigo: store.get('equipe-admin', '') || store.get('equipe-codigo', ''),
    admin: !!store.get('equipe-admin', '')
  });

  // garante nome (e código, no modo compartilhado) antes de usar as ferramentas
  function identificar() {
    return new Promise((ok) => {
      const e = eu();
      if (e.nome && (!compartilhado || e.codigo)) return ok(e);
      modal(`
        <h3>👋 Quem está testando?</h3>
        <p class="a-muted" style="margin-top:0">Seu nome aparece nas sugestões e relatórios, para todo mundo saber quem pediu o quê.</p>
        <label for="eq-nome">Seu nome</label>
        <input id="eq-nome" value="${esc(e.nome)}" placeholder="Ex.: Ana Paula" autocomplete="name" maxlength="80">
        ${compartilhado ? `<label for="eq-cod">Código da equipe</label>
        <input id="eq-cod" value="${esc(store.get('equipe-codigo', ''))}" placeholder="vem no link do grupo" autocomplete="off">` : ''}
        <p id="eq-erro" style="color:#B42323;font-size:14px;margin:0 0 8px"></p>
        <button class="btn btn-primary btn-block" id="eq-ok">Continuar</button>
      `, (m, fechar) => {
        const nome = $('#eq-nome', m); setTimeout(() => nome.focus(), 50);
        $('#eq-ok', m).onclick = async () => {
          const n = nome.value.trim().replace(/\s+/g, ' ');
          if (n.length < 2) { $('#eq-erro', m).textContent = 'Digite seu nome'; return nome.focus(); }
          if (compartilhado) {
            const c = $('#eq-cod', m).value.trim();
            try { await rpc('tw_verificar', { p_codigo: c }); store.set('equipe-codigo', c); }
            catch (err) { $('#eq-erro', m).textContent = 'Código da equipe inválido. Use o link enviado no grupo.'; return; }
          }
          store.set('equipe-nome', n);
          App.registrar('acao', `Identificado como ${n}`);
          fechar(); ok(eu());
        };
        nome.onkeydown = (ev) => { if (ev.key === 'Enter') $('#eq-ok', m).click(); };
      });
    });
  }

  function trocarNome() { store.set('equipe-nome', ''); return identificar(); }

  async function entrarAdmin(codigo) {
    if (compartilhado) {
      const n = await rpc('tw_verificar', { p_codigo: codigo });
      if (n !== 'admin') throw new Error('Esse código não é de administrador');
    } else if (codigo !== ADMIN_LOCAL) throw new Error('Código de administrador incorreto');
    store.set('equipe-admin', codigo);
    App.registrar('acao', 'Entrou como administrador');
  }
  function sairAdmin() { store.set('equipe-admin', ''); }

  // ---------- acesso à base ----------
  async function rpc(nome, params) {
    if (!compartilhado) return Local.chamar(nome, params);
    let resp;
    try {
      resp = await fetch(`${CFG.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${nome}`, {
        method: 'POST',
        headers: { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(params)
      });
    } catch (e) { throw new Error('Sem conexão com a base. Verifique a internet.'); }
    const txt = await resp.text();
    const dados = txt ? JSON.parse(txt) : null;
    if (!resp.ok) throw new Error((dados && (dados.message || dados.hint)) || 'Erro ' + resp.status);
    return dados;
  }
  // atalho que já coloca o código de quem está usando
  const chamar = (nome, params = {}) => rpc(nome, { p_codigo: eu().codigo || 'local', ...params });

  // ---------- modo local: as MESMAS regras do schema.sql, guardadas neste aparelho ----------
  const Local = (function () {
    const SITUACOES = ['Pendente', 'Enviada', 'Em análise', 'Em desenvolvimento', 'Realizada', 'Aguardando aprovação', 'Aprovada', 'Reprovada — necessita de ajuste'];
    const base = () => store.get('base-local', { seq: 0, seqT: 0, sug: [], testes: [] });
    const salvar = (b) => store.set('base-local', b);
    const agora = () => new Date().toISOString();
    const hist = (por, de, para, nota) => ({ em: agora(), por, de, para, nota: nota || '' });
    const nivel = (c) => (c === ADMIN_LOCAL ? 'admin' : 'equipe');
    const exigirAdmin = (c) => { if (nivel(c) !== 'admin') throw new Error('Somente o administrador pode fazer isso'); };
    const achar = (b, id) => { const s = b.sug.find((x) => x.id === +id); if (!s) throw new Error(`Sugestão ${id} não existe`); return s; };
    const F = {
      tw_verificar: (p) => nivel(p.p_codigo),
      tw_sug_listar: () => base().sug,
      tw_sug_criar(p) {
        const d = (p.p_descricao || '').trim(); if (d.length < 3) throw new Error('Descreva a sugestão');
        const b = base(); const s = {
          id: ++b.seq, solicitante: p.p_solicitante.trim(), criado_em: agora(), atualizado_em: agora(),
          area: (p.p_area || 'Geral').trim() || 'Geral', tela: p.p_tela || '', onde: p.p_onde || null, descricao: d,
          observacoes: p.p_observacoes || '', situacao: 'Pendente', enviada_em: null, enviada_por: null,
          aprovada_em: null, aprovada_por: null, apoios: [], afeta_aprovada: p.p_afeta || null,
          historico: [hist(p.p_solicitante.trim(), null, 'Pendente', 'Criada')]
        };
        b.sug.push(s); salvar(b); return s;
      },
      tw_sug_editar(p) {
        const b = base(); const s = achar(b, p.p_id);
        if (s.situacao === 'Aprovada') throw new Error(`Sugestão ${s.id} já foi aprovada e está travada`);
        if (nivel(p.p_codigo) !== 'admin' && s.solicitante.toLowerCase() !== p.p_nome.trim().toLowerCase()) throw new Error(`Só ${s.solicitante} (quem cadastrou) ou o administrador podem editar`);
        if (p.p_descricao && p.p_descricao.trim()) s.descricao = p.p_descricao.trim();
        if (p.p_observacoes != null) s.observacoes = p.p_observacoes;
        if (p.p_area && p.p_area.trim()) s.area = p.p_area.trim();
        s.atualizado_em = agora(); salvar(b); return s;
      },
      tw_sug_apoiar(p) {
        const b = base(); const s = achar(b, p.p_id); const n = p.p_nome.trim();
        if (!s.apoios.includes(n) && s.solicitante.toLowerCase() !== n.toLowerCase()) s.apoios.push(n);
        s.atualizado_em = agora(); salvar(b); return s;
      },
      tw_sug_enviar(p) {
        const b = base(); let q = 0; const n = p.p_nome.trim();
        b.sug.forEach((s) => { if (s.situacao === 'Pendente' && s.solicitante.toLowerCase() === n.toLowerCase()) { s.situacao = 'Enviada'; s.enviada_em = agora(); s.enviada_por = n; s.atualizado_em = agora(); s.historico.push(hist(n, 'Pendente', 'Enviada')); q++; } });
        salvar(b); return q;
      },
      tw_sug_status(p) {
        exigirAdmin(p.p_codigo);
        if (!SITUACOES.includes(p.p_situacao)) throw new Error('Situação inválida: ' + p.p_situacao);
        const b = base(); const s = achar(b, p.p_id);
        s.historico.push(hist(p.p_por, s.situacao, p.p_situacao, p.p_nota));
        let destino = p.p_situacao;
        if (destino === 'Realizada') { destino = 'Aguardando aprovação'; s.historico.push(hist(p.p_por, 'Realizada', destino, 'Liberada para conferência do solicitante')); }
        s.situacao = destino; s.atualizado_em = agora();
        if (destino === 'Aprovada') { s.aprovada_em = agora(); s.aprovada_por = p.p_por; }
        salvar(b); return s;
      },
      tw_sug_aprovar(p) {
        const b = base(); const s = achar(b, p.p_id);
        if (s.situacao !== 'Aguardando aprovação') throw new Error(`Sugestão ${s.id} não está aguardando aprovação (está: ${s.situacao})`);
        if (!p.p_aprovado && !(p.p_nota || '').trim()) throw new Error('Explique o que ainda precisa ajustar');
        const destino = p.p_aprovado ? 'Aprovada' : 'Reprovada — necessita de ajuste';
        s.historico.push(hist(p.p_nome.trim(), s.situacao, destino, p.p_nota));
        s.situacao = destino; s.atualizado_em = agora();
        s.aprovada_em = p.p_aprovado ? agora() : null; s.aprovada_por = p.p_aprovado ? p.p_nome.trim() : null;
        salvar(b); return s;
      },
      tw_sug_excluir(p) { exigirAdmin(p.p_codigo); const b = base(); const n = b.sug.length; b.sug = b.sug.filter((s) => s.id !== +p.p_id); salvar(b); return b.sug.length < n; },
      tw_teste_salvar(p) { const b = base(); const id = ++b.seqT; b.testes.push({ id, criado_em: agora(), responsavel: p.p_responsavel, tipo: p.p_tipo, resumo: p.p_resumo, relatorio: p.p_relatorio }); b.testes = b.testes.slice(-30); salvar(b); return id; },
      tw_teste_listar: () => base().testes.map(({ relatorio, ...r }) => r).reverse(),
      tw_teste_obter: (p) => (base().testes.find((t) => t.id === +p.p_id) || {}).relatorio || null
    };
    return { chamar: async (nome, p) => { if (!F[nome]) throw new Error('Função desconhecida ' + nome); return JSON.parse(JSON.stringify(F[nome](p))); } };
  })();

  return { compartilhado, eu, identificar, trocarNome, entrarAdmin, sairAdmin, chamar, rpc };
})();
