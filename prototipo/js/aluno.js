/* App do aluno (a parte que vira PWA instalada) */
window.Aluno = (function () {
  const { ic, esc, brl, dataBR, DIAS, unidade, faixa, iniciais, corAv, logo, store, toast, modal, $, $$ } = App;
  let diaSel = null;
  let unidadeSel = null;

  const eu = () => {
    const base = DB.eu;
    const extra = store.get('aulasExtras', 0);
    let aulas = base.aulasNoGrau + extra, grau = base.grau;
    while (aulas >= DB.aulasPorGrau && grau < 4) { aulas -= DB.aulasPorGrau; grau++; }
    return { ...base, aulasNoGrau: aulas, grau };
  };
  const agendados = () => store.get('agendados', []);
  const pagos = () => store.get('pagos', []);
  const chave = (d, g) => `${d}|${g.hora}|${g.unidade}`;

  function belt(fx, grau, h = 30) {
    const f = faixa(fx);
    return `<div class="belt ${fx}" style="background:${f.cor};height:${h}px"><div class="tarja">${[1, 2, 3, 4].map((i) => `<i class="${i <= grau ? 'on' : ''}"></i>`).join('')}</div></div>`;
  }

  function topo(titulo, sub) {
    const e = eu();
    if (!titulo) return `<div class="app-top"><div class="app-top-row">
      <img class="avatar" src="${logo}" alt=""><div class="who"><small>Olá,</small><b>${esc(e.apelido)} 👊</b></div>
      <button class="icon-btn" data-go="notificacoes" aria-label="Notificações">${ic('bell')}<span class="dot"></span></button>
      <button class="icon-btn" data-go="perfil" aria-label="Perfil">${ic('user')}</button></div></div>`;
    return `<div class="app-top"><div class="app-top-row"><div><div class="app-title">${titulo}</div>${sub ? `<small style="opacity:.8">${sub}</small>` : ''}</div>
      <button class="icon-btn" data-go="perfil" aria-label="Perfil">${ic('user')}</button></div>${titulo === 'Agenda' ? diasHTML() : ''}</div>`;
  }

  function proximosDias() {
    const out = []; const d = new Date();
    for (let i = 0; out.length < 7; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if (x.getDay() !== 0) out.push(x); }
    return out;
  }
  function diasHTML() {
    const ds = proximosDias(); if (diaSel == null) diaSel = 0;
    return `<div class="days" style="margin-top:14px">${ds.map((x, i) => `<button class="day ${i === diaSel ? 'on' : ''}" data-dia="${i}"><small>${i === 0 ? 'Hoje' : DIAS[x.getDay()]}</small><b>${x.getDate()}</b></button>`).join('')}</div>`;
  }

  // ---------------- telas ----------------
  function inicio() {
    const e = eu(); const pct = Math.round(e.aulasNoGrau / DB.aulasPorGrau * 100);
    const ag = agendados();
    const prox = ag[0];
    const venc = DB.pagamentos.find((p) => !p.pago && !pagos().includes(p.ref));
    const atrasado = venc && new Date(venc.venc) < new Date();
    return `${topo()}<div class="app-body">
      <div class="a-card belt-card">
        <div class="a-row" style="justify-content:space-between;margin-bottom:12px"><b>Faixa ${faixa(e.faixa).nome} · ${e.grau}º grau</b><span style="font-size:13px;opacity:.85">${pct}%</span></div>
        ${belt(e.faixa, e.grau)}
        <div class="progress" style="margin-top:14px"><div style="width:${pct}%"></div></div>
        <div class="stat-row">
          <div class="stat"><b>${e.aulasNoGrau}</b><small>aulas no grau atual</small></div>
          <div class="stat" style="background:var(--cream);color:var(--blue)"><b>${DB.aulasPorGrau - e.aulasNoGrau}</b><small>para o ${e.grau + 1}º grau</small></div>
        </div>
      </div>

      ${venc ? `<div class="a-card pay-due ${atrasado ? 'late' : ''}"><div class="a-row"><div style="flex:1"><b>Mensalidade ${venc.ref}</b><div class="a-muted">${atrasado ? '⚠ Venceu em ' : 'Vence em '}${dataBR(venc.venc)} · ${brl(venc.valor)}</div></div>
        <button class="btn-agendar" data-go="pagamentos">Pagar Pix</button></div></div>` : ''}

      <div class="a-section-title">Próxima aula</div>
      ${prox ? `<div class="class-item"><div class="hora">${prox.hora}</div><div class="info"><b>${esc(prox.turma)}</b><small>${prox.diaTxt} · ${esc(unidade(prox.unidade).nome)}</small></div><span class="chip ok" style="background:#E7F6EE;color:#1d7a4c">Agendada</span></div>`
        : `<div class="a-card a-row"><div style="flex:1"><b>Nenhuma aula agendada</b><div class="a-muted">Agende e mantenha a sequência 🔥</div></div><button class="btn-agendar" data-go="agenda">Agendar</button></div>`}

      <div class="a-section-title">Avisos do professor</div>
      <div class="a-card"><div class="a-row" style="align-items:flex-start"><div class="av" style="background:var(--blue)">${ic('bell', 18)}</div>
        <div><b>Seminário de raspagens — sábado</b><div class="a-muted">Open mat especial às 10h. Traga um parceiro!</div></div></div>
        <div class="a-sep"></div>
        <div class="a-row" style="align-items:flex-start"><div class="av" style="background:#7A4E2F">${ic('star', 18)}</div>
        <div><b>Sede de Samambaia</b><div class="a-muted">A obra está avançando — em breve, novidades!</div></div></div></div>

      <div class="a-section-title">Ranking do mês</div>
      <div class="a-card">${rankHTML(4)}<button class="btn btn-ghost btn-block btn-sm" style="margin-top:8px" data-go="evolucao">Ver evolução completa</button></div>

      <div class="a-card a-row" style="background:#EEF4F8"><div style="flex:1"><b>📲 Instale o app</b><div class="a-muted">Fica na tela inicial e atualiza sozinho.</div></div><button class="btn-agendar" id="btn-inst">Instalar</button></div>
    </div>`;
  }

  function rankHTML(n) {
    const lista = DB.alunos.map((a) => ({ nome: a.nome, n: (a.aulas % 9) + 3 })).concat([{ nome: 'Você', n: 5 + store.get('aulasExtras', 0), me: true }])
      .sort((a, b) => b.n - a.n).slice(0, n + 1);
    if (!lista.find((x) => x.me)) lista.push({ nome: 'Você', n: 5 + store.get('aulasExtras', 0), me: true });
    return lista.slice(0, n + 1).map((x, i) => `<div class="rank-item ${x.me ? 'me' : ''}"><div class="rank-pos" style="${i < 3 ? `background:${['#F2C230', '#C9CED3', '#D08B4F'][i]};color:#111` : ''}">${i + 1}º</div>
      <div class="av" style="background:${x.me ? 'var(--blue)' : corAv(x.nome)}">${x.me ? 'EU' : iniciais(x.nome)}</div><b style="flex:1;font-size:14px">${esc(x.nome.split(' ').slice(0, 2).join(' '))}</b><span class="a-muted">${x.n} aulas</span></div>`).join('');
  }

  function agenda() {
    const ds = proximosDias(); const d = ds[diaSel || 0]; const dow = d.getDay();
    if (unidadeSel == null) unidadeSel = DB.eu.unidade;
    const ag = agendados();
    const aulas = DB.grade.filter((g) => g.dia === dow && (unidadeSel === 'todas' || g.unidade === unidadeSel));
    const ativas = DB.unidades.filter((u) => u.status === 'ativa');
    return `${topo('Agenda', 'Escolha o dia e reserve sua vaga')}<div class="app-body">
      <div class="seg">${[{ id: 'todas', nome: 'Todas' }, ...ativas].map((u) => `<button class="${unidadeSel === u.id ? 'on' : ''}" data-un="${u.id}">${esc(u.nome.replace(' Fight Club', ''))}</button>`).join('')}</div>
      ${aulas.length ? aulas.map((g) => {
        const k = chave(d.toDateString(), g); const ok = ag.some((a) => a.k === k);
        const vagas = 20 - ((g.hora.charCodeAt(1) * 7 + dow * 3) % 14);
        return `<div class="class-item ${g.nivel}"><div class="hora">${g.hora}</div><div class="info"><b>${esc(g.turma)}</b><small>${esc(unidade(g.unidade).nome)} · ${vagas} vagas</small></div>
          <button class="btn-agendar ${ok ? 'ok' : ''}" data-k="${esc(k)}" data-hora="${g.hora}" data-turma="${esc(g.turma)}" data-un2="${g.unidade}" data-diatxt="${(diaSel || 0) === 0 ? 'Hoje' : DIAS[dow] + ' ' + d.getDate()}">${ok ? '✓ Agendado' : 'Agendar'}</button></div>`;
      }).join('') : `<div class="a-card" style="text-align:center"><b>Sem aulas neste dia/unidade</b><div class="a-muted">Tente outra unidade ou outro dia.</div></div>`}
      <p class="a-muted" style="text-align:center;font-size:12px;margin-top:16px">Você recebe um lembrete 2h antes. Não vai? Cancele e libere a vaga.</p>
    </div>`;
  }

  function checkin() {
    const feito = store.get('checkinHoje', null) === new Date().toDateString();
    return `${topo('Check-in', 'Escaneie o QR code do professor')}<div class="app-body">
      ${feito ? `<div class="a-card check-ok"><div class="big">${ic('check', 54)}</div><h3 style="font-size:22px">Presença confirmada!</h3><p class="a-muted">Aula contabilizada para sua graduação. Bom treino! Oss 🥋</p><button class="btn btn-ghost btn-block btn-sm" data-go="evolucao">Ver minha evolução</button></div>`
        : `<div class="scanner" id="scanner"><div class="frame"></div><div class="laser"></div><div style="position:absolute;bottom:16px;color:#fff;font-size:13px;opacity:.85">Aponte para o QR na tela do professor</div></div>
      <button class="btn btn-primary btn-block" style="margin-top:16px;background:var(--blue);color:#fff" id="simular">${ic('qr', 20)} Simular leitura do QR</button>`}
      <div class="a-card" style="margin-top:16px"><h3>Como funciona</h3>
        <p class="a-muted" style="margin:0">O professor abre a aula no painel e mostra um QR que <b>muda a cada aula</b> (não adianta mandar foto para quem faltou). Você escaneia ao chegar e pronto: sem foto no grupo, sem “pendente”.<br><br>Esqueceu o celular? O professor marca sua presença com um toque na lista.</p></div>
    </div>`;
  }

  function evolucao() {
    const e = eu(); const pct = Math.round(e.aulasNoGrau / DB.aulasPorGrau * 100);
    const hoje = new Date();
    const cells = Array.from({ length: 35 }, (_, i) => { const v = (i * 7 + 3) % 10; return v > 6 ? 'l3' : v > 4 ? 'l2' : v > 2 ? 'l1' : ''; });
    return `${topo('Evolução', 'Cada aula conta')}<div class="app-body">
      <div class="a-card" style="text-align:center">
        <div style="position:relative;width:170px;height:170px;margin:4px auto 10px">
          <svg viewBox="0 0 120 120" width="170" height="170"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--app-line)" stroke-width="12"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--blue)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(pct / 100 * 314).toFixed(1)} 314" transform="rotate(-90 60 60)"/></svg>
          <div style="position:absolute;inset:0;display:grid;place-items:center"><div><b style="font-size:34px">${pct}%</b><div class="a-muted" style="font-size:12px">do ${e.grau + 1}º grau</div></div></div>
        </div>
        ${belt(e.faixa, e.grau, 26)}
        <div class="stat-row"><div class="stat" style="background:var(--app-bg)"><b>${e.aulasNoGrau}</b><small class="a-muted">feitas no grau</small></div><div class="stat" style="background:var(--blue);color:#fff"><b>${DB.aulasPorGrau - e.aulasNoGrau}</b><small>faltam</small></div></div>
      </div>

      <div class="a-card"><h3>Frequência — últimas 5 semanas</h3><div class="heat">${cells.map((c) => `<i class="${c}"></i>`).join('')}</div>
        <div class="a-muted" style="font-size:12px;margin-top:8px">Média: 3 treinos por semana · melhor sequência: 9 dias</div></div>

      <div class="a-section-title">Linha do tempo</div>
      <div class="timeline">
        <div class="tl-item next"><div class="a-card"><b>Próximo: ${e.grau + 1}º grau</b><div class="a-muted">Faltam ${DB.aulasPorGrau - e.aulasNoGrau} aulas · previsão ${new Date(hoje.getTime() + (DB.aulasPorGrau - e.aulasNoGrau) / 3 * 7 * 864e5).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div></div></div>
        ${DB.historicoGraduacoes.slice().reverse().map((h) => `<div class="tl-item"><div class="a-card"><div class="a-row" style="justify-content:space-between"><b>${esc(h.titulo)}</b><span class="a-muted" style="font-size:12px">${dataBR(h.data)}</span></div>
          <div style="margin:10px 0">${belt(h.faixa, h.grau, 16)}</div><div class="a-muted">${esc(h.texto)}</div></div></div>`).join('')}
      </div>

      <div class="a-section-title">Ranking do mês</div>
      <div class="a-card">${rankHTML(7)}</div>
    </div>`;
  }

  function pagamentosTela() {
    const pg = pagos();
    const lista = DB.pagamentos.map((p) => ({ ...p, pago: p.pago || (pg.includes(p.ref) ? new Date().toISOString().slice(0, 10) : null), via: p.via || (pg.includes(p.ref) ? 'Pix (automático)' : null) }));
    const aberto = lista.filter((p) => !p.pago);
    return `${topo('Mensalidades', 'Plano Mensal · ' + brl(250))}<div class="app-body">
      ${aberto.length ? aberto.slice(0, 1).map((p) => { const late = new Date(p.venc) < new Date(); return `
        <div class="a-card pay-due ${late ? 'late' : ''}"><div class="a-row" style="justify-content:space-between"><b>${p.ref}</b>${late ? '<span class="chip danger" style="background:#FDE3E3;color:#B42323">Em atraso</span>' : '<span class="chip blue" style="background:#E3EEF6;color:var(--blue)">Em aberto</span>'}</div>
          <div style="font-size:34px;font-weight:800;margin:6px 0">${brl(p.valor)}</div><div class="a-muted">Vencimento ${dataBR(p.venc)}</div>
          <button class="btn btn-primary btn-block" style="margin-top:14px;background:var(--blue);color:#fff" data-pagar="${p.ref}">${ic('qr', 20)} Pagar com Pix</button>
          <p class="a-muted" style="font-size:12px;margin:10px 0 0;text-align:center">Confirmação automática — não precisa mandar comprovante.</p></div>`; }).join('')
        : `<div class="a-card check-ok" style="padding:20px"><div class="big" style="width:70px;height:70px">${ic('check', 40)}</div><b>Tudo em dia! 🙌</b></div>`}
      ${aberto.length > 1 ? `<div class="a-section-title">Próximas</div><div class="a-card">${aberto.slice(1).map((p) => `<div class="pay-row"><span>${p.ref}<br><small class="a-muted">vence ${dataBR(p.venc)}</small></span><b>${brl(p.valor)}</b></div>`).join('')}</div>` : ''}
      <div class="a-section-title">Histórico</div>
      <div class="a-card">${lista.filter((p) => p.pago).reverse().map((p) => `<div class="pay-row"><span><b>${p.ref}</b><br><small class="a-muted">pago em ${dataBR(p.pago)} · ${p.via}</small></span><span style="text-align:right"><b>${brl(p.valor)}</b><br><small style="color:var(--ok);font-weight:700">✓ Pago</small></span></div>`).join('')}</div>
    </div>`;
  }

  function perfil() {
    const e = eu();
    return `${topo('Perfil')}<div class="app-body">
      <div class="a-card a-row"><div class="av" style="width:60px;height:60px;background:var(--blue);font-size:20px">AD</div><div><b>${esc(e.nome)}</b><div class="a-muted">Aluno desde ${dataBR(e.desde)} · ${esc(unidade(e.unidade).nome)}</div></div></div>
      <div class="a-section-title">Dependentes</div>
      <div class="a-card">${e.dependentes.map((d) => `<div class="a-row"><div class="av" style="background:#E0A526;color:#111">${iniciais(d.nome)}</div><div style="flex:1"><b>${esc(d.nome)}</b><div style="margin-top:6px;max-width:160px">${belt(d.faixa, d.grau, 14)}</div></div></div>`).join('')}
        <p class="a-muted" style="font-size:13px;margin:12px 0 0">Pais acompanham presença, graduação e mensalidade dos filhos na mesma conta.</p></div>
      <div class="a-section-title">Notificações</div>
      <div class="a-card">${[['Lembrete de aula (2h antes)', true], ['Vencimento da mensalidade', true], ['Avisos do professor', true], ['Ranking semanal', false]].map(([n, on], i) => `<div class="pay-row"><span>${n}</span><button class="toggle ${store.get('notif' + i, on) ? 'on' : ''}" data-notif="${i}" aria-label="${n}"></button></div>`).join('')}</div>
      <button class="btn btn-ghost btn-block" id="btn-inst" style="color:var(--app-text);border-color:var(--app-line)">${ic('download', 18)} Instalar app no celular</button>
      <button class="btn btn-ghost btn-block" style="color:var(--app-muted);border-color:transparent;margin-top:6px" id="reset">Zerar dados de demonstração</button>
      <p class="a-muted" style="text-align:center;font-size:12px">The Way · protótipo v${App.VERSAO}</p>
    </div>`;
  }

  function notificacoes() {
    return `${topo('Avisos')}<div class="app-body">${[
      ['bell', 'Lembrete', 'Sua aula Avançado começa às 20:30 na Hammer BSB. Vai treinar?', '2h atrás'],
      ['wallet', 'Mensalidade', 'Sua mensalidade de novembro está disponível. Pague pelo Pix no app.', 'ontem'],
      ['medal', 'Graduação', 'Faltam poucas aulas para o seu próximo grau. Continue assim!', '3 dias'],
      ['camera', 'Foto da turma', 'A foto do treino de quarta já está na galeria.', '5 dias']
    ].map(([i, t, m, q]) => `<div class="a-card a-row" style="align-items:flex-start"><div class="av" style="background:var(--blue)">${ic(i, 18)}</div><div style="flex:1"><div class="a-row" style="justify-content:space-between"><b>${t}</b><small class="a-muted">${q}</small></div><div class="a-muted">${m}</div></div></div>`).join('')}</div>`;
  }

  const TELAS = { inicio, agenda, checkin, evolucao, pagamentos: pagamentosTela, perfil, notificacoes };

  function render(r) {
    const sub = TELAS[r.sub] ? r.sub : 'inicio';
    const tabs = [['inicio', 'home', 'Início'], ['agenda', 'cal', 'Agenda'], ['checkin', 'qr', 'Check-in'], ['evolucao', 'trophy', 'Evolução'], ['pagamentos', 'wallet', 'Pagamentos']];
    return `<div class="app-stage"><div class="phone">${TELAS[sub]()}
      <nav class="tabbar" aria-label="Menu do app">${tabs.map(([id, icn, nome]) => id === 'checkin'
        ? `<a class="tab qr ${sub === id ? 'on' : ''}" href="#/app/${id}"><span class="qr-btn">${ic(icn, 28)}</span>${nome}</a>`
        : `<a class="tab ${sub === id ? 'on' : ''}" href="#/app/${id}">${ic(icn)}${nome}</a>`).join('')}</nav>
    </div></div>`;
  }

  function pixModal(ref) {
    const p = DB.pagamentos.find((x) => x.ref === ref);
    const codigo = '00020126580014BR.GOV.BCB.PIX0136thewaybjj-prototipo-pix-exemplo5204000053039865406250.005802BR5913THE WAY BJJ6008BRASILIA62070503***6304ABCD';
    const qr = Array.from({ length: 21 * 21 }, (_, i) => { const x = i % 21, y = (i / 21) | 0; const f = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7; if (f(0, 0) || f(14, 0) || f(0, 14)) { const lx = x % 14 % 7, ly = y % 14 % 7; return (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5)); } return ((x * 31 + y * 17 + x * y) % 7) < 3; })
      .map((on, i) => on ? `<rect x="${i % 21}" y="${(i / 21) | 0}" width="1" height="1"/>` : '').join('');
    modal(`<h3>Pix · ${ref}</h3><p class="a-muted" style="margin:0">${brl(p.valor)} para THE WAY BJJ</p>
      <svg class="pix-qr" viewBox="0 0 21 21" shape-rendering="crispEdges" fill="#0F1A22">${qr}</svg>
      <div class="copia"><span style="flex:1">${codigo.slice(0, 60)}…</span><button class="btn-agendar" id="copiar">Copiar</button></div>
      <div id="pix-status" class="a-row" style="justify-content:center;margin:16px 0;gap:8px;color:var(--app-muted)"><span class="spin">⏳</span> Aguardando pagamento…</div>
      <button class="btn btn-primary btn-block" id="simpag">Simular: pagamento feito no banco</button>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fechar</button>`, (m, fechar) => {
      $('#copiar', m).onclick = () => { try { navigator.clipboard.writeText(codigo); } catch (e) { } toast('Código Pix copiado'); };
      $('#simpag', m).onclick = () => {
        $('#pix-status', m).innerHTML = '<span style="color:var(--ok);font-weight:800">✓ Pagamento recebido! Baixa automática feita.</span>';
        const l = pagos(); l.push(ref); store.set('pagos', l);
        setTimeout(() => { fechar(); App.render(); toast('Mensalidade paga ✓ — recibo no histórico'); }, 1300);
      };
    });
  }

  function mount(root, r) {
    $$('[data-go]', root).forEach((b) => b.onclick = () => location.hash = '#/app/' + b.dataset.go);
    $$('[data-dia]', root).forEach((b) => b.onclick = () => { diaSel = +b.dataset.dia; App.render(); });
    $$('[data-un]', root).forEach((b) => b.onclick = () => { unidadeSel = b.dataset.un; App.render(); });
    $$('[data-k]', root).forEach((b) => b.onclick = () => {
      let l = agendados();
      if (l.some((a) => a.k === b.dataset.k)) { l = l.filter((a) => a.k !== b.dataset.k); toast('Agendamento cancelado — vaga liberada'); }
      else { l.push({ k: b.dataset.k, hora: b.dataset.hora, turma: b.dataset.turma, unidade: b.dataset.un2, diaTxt: b.dataset.diatxt }); toast('Aula agendada ✓ Lembrete 2h antes'); }
      store.set('agendados', l); App.render();
    });
    const sim = $('#simular', root);
    if (sim) sim.onclick = () => { sim.disabled = true; sim.textContent = 'Lendo QR…'; setTimeout(() => { store.set('checkinHoje', new Date().toDateString()); store.set('aulasExtras', store.get('aulasExtras', 0) + 1); App.render(); }, 1100); };
    $$('[data-pagar]', root).forEach((b) => b.onclick = () => pixModal(b.dataset.pagar));
    const inst = $('#btn-inst', root); if (inst) inst.onclick = App.instalar;
    $$('[data-notif]', root).forEach((b) => b.onclick = () => { const k = 'notif' + b.dataset.notif; const v = !b.classList.contains('on'); store.set(k, v); b.classList.toggle('on', v); });
    const rs = $('#reset', root); if (rs) rs.onclick = () => { ['agendados', 'pagos', 'checkinHoje', 'aulasExtras'].forEach((k) => store.set(k, k === 'aulasExtras' ? 0 : k === 'checkinHoje' ? null : [])); toast('Demonstração zerada'); location.hash = '#/app/inicio'; };
  }

  return { render, mount };
})();
