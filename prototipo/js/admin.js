/* Painel do professor */
window.Admin = (function () {
  const { ic, esc, brl, DIAS, DIAS_LONGO, unidade, faixa, iniciais, corAv, logo, store, toast, modal, $, $$ } = App;
  let busca = '';

  const experimentais = () => [...store.get('experimentais', []), ...DB.experimentais];
  const prontos = () => DB.alunos.filter((a) => a.aulas >= DB.aulasPorGrau);
  const autos = () => DB.automacoes.map((a) => ({ ...a, on: store.get('auto:' + a.id, a.on) }));

  const MENU = [
    ['hoje', 'home', 'Hoje'],
    ['alunos', 'users', 'Alunos'],
    ['graduacoes', 'medal', 'Graduações', () => prontos().length],
    ['financeiro', 'wallet', 'Financeiro', () => DB.alunos.filter((a) => a.status === 'atrasado').length],
    ['experimentais', 'star', 'Aulas experimentais', () => experimentais().filter((e) => e.status !== 'compareceu').length],
    ['automacoes', 'bot', 'Agente & automações'],
    ['grade', 'cal', 'Grade & unidades']
  ];

  function beltDot(fx, grau) { const f = faixa(fx); return `<span class="belt-dot" style="background:${f.cor}"></span>${f.nome}${grau ? ` · ${grau}º` : ''}`; }
  function statusChip(s) { return { 'em-dia': '<span class="chip ok">Em dia</span>', atrasado: '<span class="chip danger">Atrasado</span>', experimental: '<span class="chip warn">Experimental</span>' }[s] || s; }

  function hoje() {
    const d = new Date(); const dow = d.getDay() || 1;
    const aulas = DB.grade.filter((g) => g.dia === dow);
    const presentes = store.get('presencas', [1, 2, 5]);
    const lista = DB.alunos.slice(0, 8);
    const ativa = aulas[aulas.length - 1] || DB.grade[4];
    const receita = DB.alunos.filter((a) => a.status === 'em-dia').length * 250;
    return `<h1>Bom treino, professor 👊</h1><p class="muted">${DIAS_LONGO[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} · tudo o que precisa num lugar só</p>
      <div class="kpis">
        <div class="kpi"><small>Alunos ativos</small><b>${DB.alunos.length}</b><span class="trend">+3 este mês</span></div>
        <div class="kpi"><small>Recebido no mês (Pix)</small><b>${brl(receita).replace(',00', '')}</b><span class="trend">baixa automática</span></div>
        <div class="kpi"><small>Mensalidades atrasadas</small><b style="color:#ff7a7a">${DB.alunos.filter((a) => a.status === 'atrasado').length}</b><span class="muted" style="font-size:12px">agente já cobrou</span></div>
        <div class="kpi"><small>Experimentais na semana</small><b>${experimentais().length}</b><span class="trend">vindas do agente/site</span></div>
      </div>
      <div class="cols">
        <div class="panel"><h3>${ic('qr', 18)} Aula agora: ${esc(ativa.turma)} · ${ativa.hora} <span class="chip blue" style="margin-left:auto">${esc(unidade(ativa.unidade).nome)}</span></h3>
          <div class="qr-aula">
            <div style="background:#fff;padding:10px;border-radius:12px;width:150px"><svg viewBox="0 0 21 21" width="130" height="130" shape-rendering="crispEdges">${qr(Date.now() / 30000 | 0)}</svg><div style="color:#111;font-size:11px;text-align:center;font-weight:700">muda a cada aula</div></div>
            <div><p class="muted" style="margin-top:0;font-size:14px">Mostre este QR no tablet/celular. O aluno escaneia e a presença entra sozinha. Ou marque com um toque:</p>
              ${lista.map((a) => `<div class="presenca"><div class="av" style="background:${corAv(a.nome)}">${iniciais(a.nome)}</div><div style="flex:1;min-width:0"><b style="font-size:14px">${esc(a.nome)}</b><div class="muted" style="font-size:12px">${beltDot(a.faixa, a.grau)}</div></div>
                <button class="toggle ${presentes.includes(a.id) ? 'on' : ''}" data-pres="${a.id}" aria-label="Presença de ${esc(a.nome)}"></button></div>`).join('')}
              <button class="btn btn-blue btn-sm" style="margin-top:12px" id="foto">${ic('camera', 16)} Enviar foto da turma</button>
            </div></div></div>
        <div>
          <div class="panel"><h3>${ic('cal', 18)} Aulas de hoje</h3>${aulas.map((g) => `<div class="presenca"><b style="min-width:52px">${g.hora}</b><div style="flex:1"><b style="font-size:14px">${esc(g.turma)}</b><div class="muted" style="font-size:12px">${esc(unidade(g.unidade).nome)}</div></div><span class="chip">${(g.hora.charCodeAt(1) % 9) + 4} agendados</span></div>`).join('') || '<p class="muted">Sem aulas hoje.</p>'}</div>
          <div class="panel"><h3>${ic('bell', 18)} Precisa da sua atenção</h3>
            ${prontos().length ? `<div class="presenca"><span class="chip ok">${prontos().length}</span><div style="flex:1;font-size:14px">alunos prontos para receber grau</div><a class="btn btn-ghost btn-sm" href="#/admin/graduacoes">Ver</a></div>` : ''}
            <div class="presenca"><span class="chip warn">${experimentais().filter((e) => e.status === 'confirmado').length}</span><div style="flex:1;font-size:14px">aulas experimentais confirmadas</div><a class="btn btn-ghost btn-sm" href="#/admin/experimentais">Ver</a></div>
            <div class="presenca"><span class="chip danger">2</span><div style="flex:1;font-size:14px">alunos sem treinar há 3 semanas</div><a class="btn btn-ghost btn-sm" href="#/admin/alunos">Ver</a></div>
          </div>
        </div>
      </div>`;
  }

  function qr(seed) {
    let out = '';
    for (let i = 0; i < 441; i++) {
      const x = i % 21, y = (i / 21) | 0; const f = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7;
      let on;
      if (f(0, 0) || f(14, 0) || f(0, 14)) { const lx = x % 14 % 7, ly = y % 14 % 7; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5); }
      else on = ((x * 13 + y * 7 + x * y + seed) % 5) < 2;
      if (on) out += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return out;
  }

  function alunos() {
    const l = DB.alunos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()));
    return `<h1>Alunos</h1><p class="muted">${DB.alunos.length} alunos · clique para ver detalhes</p>
      <div class="panel" style="margin-top:18px"><div class="a-row" style="gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <input id="busca" value="${esc(busca)}" placeholder="Buscar aluno…" style="flex:1;min-width:180px;background:var(--ink);border:1px solid var(--line);color:var(--cream);border-radius:10px;padding:10px 12px;font:inherit">
        <button class="btn btn-blue btn-sm" id="novo">+ Novo aluno</button></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Aluno</th><th>Faixa</th><th>Aulas no grau</th><th>Unidade</th><th>Mensalidade</th></tr></thead><tbody>
      ${l.map((a) => `<tr><td><div class="a-row" style="gap:10px"><div class="av" style="background:${corAv(a.nome)};width:30px;height:30px;font-size:11px">${iniciais(a.nome)}</div>${esc(a.nome)}</div></td>
        <td>${beltDot(a.faixa, a.grau)}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="width:90px;background:#2a343d"><div style="width:${Math.min(100, a.aulas / DB.aulasPorGrau * 100)}%;background:${a.aulas >= DB.aulasPorGrau ? 'var(--ok)' : 'var(--blue-300)'}"></div></div>${a.aulas}/${DB.aulasPorGrau}</div></td>
        <td>${esc(unidade(a.unidade).nome)}</td><td>${statusChip(a.status)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  function graduacoes() {
    const p = prontos();
    return `<h1>Graduações</h1><p class="muted">Regra atual: <b>${DB.aulasPorGrau} aulas por grau</b> (o professor ajusta por faixa)</p>
      <div class="panel" style="margin-top:18px"><h3>${ic('medal', 18)} Prontos para graduar (${p.length})</h3>
        ${p.map((a) => `<div class="presenca"><div class="av" style="background:${corAv(a.nome)}">${iniciais(a.nome)}</div><div style="flex:1"><b>${esc(a.nome)}</b><div class="muted" style="font-size:13px">${beltDot(a.faixa, a.grau)} → ${a.grau >= 4 ? 'próxima faixa' : (a.grau + 1) + 'º grau'} · ${a.aulas} aulas</div></div>
          <button class="btn btn-ok btn-sm" data-grad="${a.id}">Graduar</button></div>`).join('') || '<p class="muted">Ninguém ainda.</p>'}
        <p class="muted" style="font-size:13px">Ao graduar: o aluno recebe parabéns no app/WhatsApp, a linha do tempo dele ganha a data e a foto, e a contagem recomeça.</p></div>
      <div class="panel"><h3>${ic('gear', 18)} Regras por faixa</h3><div class="table-wrap"><table class="t"><thead><tr><th>Faixa</th><th>Aulas por grau</th><th>Tempo mínimo na faixa</th></tr></thead><tbody>
        ${DB.faixas.adulto.concat(DB.faixas.infantil).map((f, i) => `<tr><td><span class="belt-dot" style="background:${f.cor}"></span>${f.nome}</td><td>${i < 5 ? 45 + i * 10 : 30} aulas</td><td>${i < 5 ? ['—', '2 anos', '1,5 ano', '1 ano', '—'][i] : 'conforme idade'}</td></tr>`).join('')}
      </tbody></table></div><p class="muted" style="font-size:12px">Valores ilustrativos — o professor define.</p></div>`;
  }

  function financeiro() {
    const meses = [['Jun', 3250], ['Jul', 3500], ['Ago', 3250], ['Set', 3750], ['Out', 3500], ['Nov', 3250]];
    const max = Math.max(...meses.map((m) => m[1]));
    const atras = DB.alunos.filter((a) => a.status === 'atrasado');
    return `<h1>Financeiro</h1><p class="muted">Pix com baixa automática — sem conferir extrato</p>
      <div class="kpis"><div class="kpi"><small>Previsto no mês</small><b>${brl(DB.alunos.length * 250).replace(',00', '')}</b></div><div class="kpi"><small>Recebido</small><b>${brl((DB.alunos.length - atras.length - 1) * 250).replace(',00', '')}</b></div><div class="kpi"><small>Em atraso</small><b style="color:#ff7a7a">${brl(atras.length * 250).replace(',00', '')}</b></div></div>
      <div class="cols"><div class="panel"><h3>${ic('chart', 18)} Recebimentos (6 meses)</h3><div class="bars" style="margin-bottom:26px">${meses.map(([m, v]) => `<div style="height:${v / max * 100}%" title="${brl(v)}"><span>${m}</span></div>`).join('')}</div></div>
      <div class="panel"><h3>${ic('wallet', 18)} Em atraso</h3>${atras.map((a) => `<div class="presenca"><div class="av" style="background:${corAv(a.nome)}">${iniciais(a.nome)}</div><div style="flex:1"><b style="font-size:14px">${esc(a.nome)}</b><div class="muted" style="font-size:12px">Nov/2026 · ${brl(250)} · lembrete enviado pelo agente</div></div><button class="btn btn-ghost btn-sm" data-cobrar="${esc(a.nome)}">Reenviar Pix</button></div>`).join('')}</div></div>
      <div class="panel"><h3>${ic('check', 18)} Últimos pagamentos</h3><div class="table-wrap"><table class="t"><thead><tr><th>Aluno</th><th>Referência</th><th>Valor</th><th>Pago em</th><th>Como</th></tr></thead><tbody>
        ${DB.alunos.filter((a) => a.status === 'em-dia').slice(0, 6).map((a, i) => `<tr><td>${esc(a.nome)}</td><td>Nov/2026</td><td>${brl(250)}</td><td>${String(10 - (i % 4)).padStart(2, '0')}/11/2026</td><td><span class="chip ok">Pix · automático</span></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  function experimentaisTela() {
    const l = experimentais();
    return `<h1>Aulas experimentais</h1><p class="muted">Agendadas sozinhas pelo agente (site, WhatsApp, Instagram) — ninguém precisou responder</p>
      <div class="panel" style="margin-top:18px"><div class="table-wrap"><table class="t"><thead><tr><th>Interessado</th><th>Público</th><th>Quando</th><th>Origem</th><th>Status</th></tr></thead><tbody>
      ${l.map((e) => `<tr><td><b>${esc(e.nome)}</b></td><td>${esc(e.idade)}</td><td>${esc(e.quando)}</td><td>${esc(e.origem)}</td><td>${e.status === 'compareceu' ? '<span class="chip ok">Compareceu</span>' : e.status === 'confirmado' ? '<span class="chip blue">Confirmado</span>' : `<span class="chip warn">${esc(e.status)}</span>`}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted" style="font-size:13px;margin-bottom:0">Teste agora: volte ao <a href="#/">site</a>, clique em “Agendar aula experimental” e veja o agendamento aparecer aqui.</p></div>
      <div class="panel"><h3>${ic('bot', 18)} Funil do mês</h3><div class="kpis" style="margin:0"><div class="kpi"><small>Conversas com o agente</small><b>48</b></div><div class="kpi"><small>Agendaram experimental</small><b>${l.length + 9}</b></div><div class="kpi"><small>Compareceram</small><b>8</b></div><div class="kpi"><small>Matricularam</small><b>5</b></div></div></div>`;
  }

  function automacoes() {
    return `<h1>Agente & automações</h1><p class="muted">O que o assistente da The Way faz sozinho — o professor liga e desliga</p>
      <div class="cols" style="margin-top:18px"><div class="panel">${autos().map((a) => `<div class="auto-item"><div class="av" style="background:var(--blue)">${ic('bot', 18)}</div><div style="flex:1"><b>${esc(a.nome)}</b><div class="muted" style="font-size:14px">${esc(a.desc)}</div><span class="chip blue" style="margin-top:6px">${esc(a.canal)}</span></div><button class="toggle ${a.on ? 'on' : ''}" data-auto="${a.id}" aria-label="${esc(a.nome)}"></button></div>`).join('')}</div>
      <div><div class="panel"><h3>${ic('chat', 18)} Exemplo de conversa no WhatsApp</h3>
        <div style="background:#ECE5DD;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px">
          <div class="msg me">Oi, quanto custa o jiu-jitsu? Nunca treinei</div>
          <div class="msg bot">Oss! 🥋 O plano mensal é R$ 250 com treinos ilimitados. E a primeira aula é grátis! Quer agendar? Tenho hoje 19:15 (iniciante) na Gladius ou amanhã 06:00 na Hammer.</div>
          <div class="msg me">Hoje 19:15</div>
          <div class="msg bot">✅ Agendado! Te mando o endereço e um lembrete às 17:15. Leve bermuda e camiseta. Até mais tarde!</div>
        </div><p class="muted" style="font-size:13px">Se a pergunta fugir do que ele sabe, o agente avisa o professor e passa a conversa.</p></div>
        <div class="panel"><h3>${ic('gear', 18)} Base de conhecimento do agente</h3><p class="muted" style="font-size:14px;margin:0">Grade, unidades, planos, regras do tatame e perguntas frequentes vêm direto do sistema. Mudou um horário no painel → o agente já responde certo.</p></div></div></div>`;
  }

  function grade() {
    return `<h1>Grade & unidades</h1><p class="muted">Alterou aqui → muda no site, no app e nas respostas do agente</p>
      ${DB.unidades.map((u) => { const g = DB.grade.filter((x) => x.unidade === u.id); return `<div class="panel" style="margin-top:16px"><h3>${ic('pin', 18)} ${esc(u.nome)} ${u.status === 'em-breve' ? '<span class="chip warn">em construção</span>' : ''}<span class="muted" style="font-weight:500;font-size:13px;margin-left:auto">${esc(u.endereco)}</span></h3>
        ${g.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Dia</th><th>Horário</th><th>Turma</th><th>Público</th><th></th></tr></thead><tbody>${g.map((x) => `<tr><td>${DIAS_LONGO[x.dia]}</td><td><b>${x.hora}</b></td><td>${esc(x.turma)}</td><td>${x.nivel === 'infantil' ? '<span class="chip warn">Infantil</span>' : '<span class="chip">Adulto</span>'}</td><td><button class="btn btn-ghost btn-sm" data-edit>Editar</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma turma cadastrada ainda.</p>'}
        <button class="btn btn-ghost btn-sm" style="margin-top:10px" data-edit>+ Adicionar horário</button></div>`; }).join('')}`;
  }

  const TELAS = { hoje, alunos, graduacoes, financeiro, experimentais: experimentaisTela, automacoes, grade };

  function render(r) {
    const sub = TELAS[r.sub] ? r.sub : 'hoje';
    const nav = MENU.map(([id, icn, nome, cnt]) => { const n = cnt && cnt(); return `<a href="#/admin/${id}" class="${sub === id ? 'on' : ''}">${ic(icn, 18)} ${nome}${n ? `<span class="count">${n}</span>` : ''}</a>`; }).join('');
    return `<div class="admin-mobile-nav">${MENU.map(([id, , nome]) => `<a href="#/admin/${id}" class="${sub === id ? 'on' : ''}">${nome}</a>`).join('')}</div>
      <div class="admin"><aside class="admin-side"><a class="brand" href="#/"><img src="${logo}" alt=""><b>THE WAY</b></a><nav>${nav}</nav>
        <div class="muted" style="font-size:12px;padding:20px 12px 0">Painel do professor · v${App.VERSAO}</div></aside>
      <section class="admin-main">${TELAS[sub]()}</section></div>`;
  }

  function mount(root) {
    $$('[data-pres]', root).forEach((b) => b.onclick = () => {
      const id = +b.dataset.pres; let l = store.get('presencas', [1, 2, 5]);
      l = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]; store.set('presencas', l); b.classList.toggle('on');
      toast(b.classList.contains('on') ? 'Presença marcada ✓' : 'Presença removida');
    });
    const f = $('#foto', root); if (f) f.onclick = () => toast('📸 Na versão real: abre a câmera, a foto vai para a galeria e para quem treinou');
    $$('[data-grad]', root).forEach((b) => b.onclick = () => { const a = DB.alunos.find((x) => x.id === +b.dataset.grad); a.grau = Math.min(4, a.grau + 1); a.aulas = 0; toast(`🎉 ${a.nome.split(' ')[0]} graduado! Mensagem de parabéns enviada.`); App.render(); });
    $$('[data-cobrar]', root).forEach((b) => b.onclick = () => toast(`Pix reenviado para ${b.dataset.cobrar.split(' ')[0]} pelo WhatsApp`));
    $$('[data-auto]', root).forEach((b) => b.onclick = () => { const v = !b.classList.contains('on'); store.set('auto:' + b.dataset.auto, v); b.classList.toggle('on', v); toast(v ? 'Automação ligada' : 'Automação desligada'); });
    $$('[data-edit]', root).forEach((b) => b.onclick = () => toast('Na versão real: editar horário (muda no site, app e agente na hora)'));
    const n = $('#novo', root); if (n) n.onclick = () => toast('Na versão real: cadastro com convite por WhatsApp para o aluno');
    const bu = $('#busca', root); if (bu) bu.oninput = () => { busca = bu.value; const pos = bu.selectionStart; App.render(); const nb = $('#busca'); nb.focus(); nb.setSelectionRange(pos, pos); };
  }

  return { render, mount };
})();
