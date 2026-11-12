/* Site público (institucional) */
window.Site = (function () {
  const { ic, esc, brl, DIAS_LONGO, unidade, logo, $, $$ } = App;
  let filtroUnidade = 'todas';
  let filtroPublico = 'todos';

  function gradeHTML() {
    const itens = DB.grade.filter((g) =>
      (filtroUnidade === 'todas' || g.unidade === filtroUnidade) &&
      (filtroPublico === 'todos' || g.nivel === filtroPublico));
    return [1, 2, 3, 4, 5, 6].map((d) => {
      const doDia = itens.filter((g) => g.dia === d);
      return `<div class="grade-col"><h4>${DIAS_LONGO[d]}</h4>${doDia.length ? doDia.map((g) => `
        <div class="slot ${g.nivel}"><b>${g.hora}</b><span>${esc(g.turma)}</span><small>${esc(unidade(g.unidade).nome)}</small></div>`).join('')
        : '<p class="muted" style="font-size:13px">—</p>'}</div>`;
    }).join('');
  }

  function render() {
    const u = DB.unidades;
    return `
    <header class="site-header"><div class="wrap">
      <a class="brand" href="#/"><img src="${logo}" alt="Logo The Way"><b>THE WAY</b></a>
      <nav class="site-nav" id="site-nav">
        <a href="#/site/sobre">A escola</a><a href="#/site/unidades">Unidades</a><a href="#/site/grade">Horários</a>
        <a href="#/site/planos">Planos</a><a href="#/site/app">App</a><a href="#/site/regras">Regras</a><a href="#/site/faq">Dúvidas</a>
        <a href="#/app/inicio" class="nav-mobile-only">Área do aluno →</a>
      </nav>
      <a class="btn btn-primary btn-area" href="#/app/inicio">${ic('user', 18)} Área do aluno</a>
      <button class="menu-btn" id="menu-btn" aria-label="Abrir menu">${ic('menu', 26)}</button>
    </div></header>

    <section class="hero"><div class="wrap hero-grid">
      <div>
        <div class="eyebrow">Escola de Jiu-jitsu brasileiro · Brasília</div>
        <h1>O caminho<br>começa no <em>tatame</em>.</h1>
        <p class="lead">Treinos para todas as idades e níveis — do primeiro dia de faixa branca à competição. Disciplina, respeito e superação.</p>
        <div class="hero-cta">
          <button class="btn btn-primary" data-exp>${ic('cal', 20)} Agendar aula experimental grátis</button>
          <a class="btn btn-ghost" href="#/site/grade">Ver horários</a>
        </div>
        <div class="hero-badges">
          <span class="chip">${ic('pin', 14)} ${u.filter((x) => x.status === 'ativa').length} unidades + sede própria chegando</span>
          <span class="chip">${ic('kid', 14)} Turmas infantis</span>
          <span class="chip">${ic('medal', 14)} Equipe de competição</span>
        </div>
      </div>
      <div class="hero-logo"><img src="${logo}" alt="THE WAY"></div>
    </div></section>

    <div class="lema" aria-hidden="true"><div class="lema-track">${Array(4).fill(['Disciplina', 'Respeito', 'Superação', 'The Way', 'Oss']).flat().concat(Array(4).fill(['Disciplina', 'Respeito', 'Superação', 'The Way', 'Oss']).flat()).map((w) => `<span>${w}</span>`).join('')}</div></div>

    <section class="section" id="sobre"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">A escola</div><h2>Jiu-jitsu para<br>todo mundo</h2></div>
      <p class="muted" style="max-width:460px">Texto institucional a escrever com o professor: história da THE WAY, linhagem, conquistas e o que torna a escola diferente.</p></div>
      <div class="cards">
        <div class="card"><div class="ico">${ic('users')}</div><h3>Iniciantes</h3><p class="muted">Nunca treinou? Turmas e horários pensados para quem está começando, com acompanhamento de perto.</p></div>
        <div class="card"><div class="ico">${ic('kid')}</div><h3>Infantil</h3><p class="muted">Coordenação, disciplina e confiança. Graduação infantil e acompanhamento dos pais pelo app.</p></div>
        <div class="card"><div class="ico">${ic('trophy')}</div><h3>Avançado & competição</h3><p class="muted">Treino forte, open mat e preparação para campeonatos com a equipe.</p></div>
        <div class="card"><div class="ico">${ic('chart')}</div><h3>Evolução no app</h3><p class="muted">Cada aula conta: veja quantas faltam para o próximo grau e acompanhe sua faixa.</p></div>
      </div>
    </div></section>

    <section class="section alt" id="unidades"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">Onde treinar</div><h2>Unidades</h2></div></div>
      <div class="cards">${u.map((x) => `
        <div class="card unit ${x.status === 'em-breve' ? 'soon' : ''}">
          <div class="ico">${ic(x.status === 'em-breve' ? 'star' : 'pin')}</div>
          <h3>${esc(x.nome)}</h3>
          <p class="muted" style="margin:0 0 10px">${esc(x.endereco)}</p>
          ${x.status === 'em-breve' ? '<span class="chip warn">Em construção</span>' : `<span class="chip blue">${esc(x.insta)}</span>`}
          ${x.nota ? `<p class="muted" style="font-size:12px;margin:10px 0 0">${esc(x.nota)} · confirmar unidade</p>` : ''}
        </div>`).join('')}</div>
    </div></section>

    <section class="section" id="grade"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">Grade horária</div><h2>Horários</h2></div>
        <span class="chip warn">Grade de exemplo — confirmar com o professor</span></div>
      <div class="filters" id="f-unid">
        <button class="filter ${filtroUnidade === 'todas' ? 'on' : ''}" data-u="todas">Todas as unidades</button>
        ${u.filter((x) => x.status === 'ativa').map((x) => `<button class="filter ${filtroUnidade === x.id ? 'on' : ''}" data-u="${x.id}">${esc(x.nome)}</button>`).join('')}
      </div>
      <div class="filters" id="f-pub">
        ${[['todos', 'Todos'], ['adulto', 'Adulto'], ['infantil', 'Infantil']].map(([k, n]) => `<button class="filter ${filtroPublico === k ? 'on' : ''}" data-p="${k}">${n}</button>`).join('')}
      </div>
      <div class="grade" id="grade-box">${gradeHTML()}</div>
    </div></section>

    <section class="section alt" id="professores"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">Equipe</div><h2>Professores</h2></div></div>
      <div class="cards">${DB.professores.map((p) => `
        <div class="card"><div class="a-row" style="margin-bottom:12px"><div class="av" style="width:56px;height:56px;background:var(--blue)">${ic('user', 26)}</div>
        <div><h3 style="margin:0">${esc(p.nome)}</h3><span class="belt-dot" style="background:${App.faixa(p.faixa).cor}"></span><span class="muted" style="font-size:13px">Faixa ${App.faixa(p.faixa).nome.toLowerCase()}</span></div></div>
        <p class="muted" style="margin:0">${esc(p.texto)}</p></div>`).join('')}</div>
    </div></section>

    <section class="section" id="planos"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">Planos</div><h2>Comece hoje</h2></div><p class="muted">Primeira aula grátis. Sem taxa de matrícula (a confirmar).</p></div>
      <div class="cards">${DB.planos.map((p) => `
        <div class="card plano ${p.destaque ? 'destaque' : ''}">
          <h3>${esc(p.nome)}</h3>
          <div class="preco">${p.preco ? brl(p.preco).replace(',00', '') : 'Consulte'}<small>${p.preco ? p.periodo : ''}</small></div>
          <ul>${p.itens.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          <button class="btn ${p.destaque ? 'btn-blue' : 'btn-ghost'} btn-block" data-exp>Agendar aula experimental</button>
        </div>`).join('')}</div>
    </div></section>

    <section class="section alt" id="app"><div class="wrap app-promo">
      <div>
        <div class="eyebrow">App The Way</div><h2>Seu treino<br>na palma da mão</h2>
        <ul class="muted" style="font-size:17px;line-height:2">
          <li>Agende a aula e faça check-in pelo QR code</li>
          <li>Veja faixa, grau e quantas aulas faltam</li>
          <li>Pague a mensalidade por Pix — baixa automática</li>
          <li>Ranking, avisos e fotos da turma</li>
        </ul>
        <div class="hero-cta"><a class="btn btn-primary" href="#/app/inicio">Abrir o app</a><button class="btn btn-ghost" id="btn-instalar">${ic('download', 18)} Instalar no celular</button></div>
        <p class="muted" style="font-size:13px;margin-top:12px">Não precisa de loja de aplicativos: instala direto pelo navegador e atualiza sozinho.</p>
      </div>
      <a class="phone-mini" href="#/app/inicio" aria-label="Abrir app do aluno">
        <div style="background:var(--blue);color:var(--cream);padding:22px 14px 16px"><div style="font-size:11px;opacity:.8">Olá,</div><b>Aluno</b>
          <div class="belt" style="background:#F5F5F2;margin-top:12px;height:20px"><div class="tarja"><i class="on"></i><i></i><i></i><i></i></div></div>
          <div class="progress" style="margin-top:12px"><div style="width:48%"></div></div><div style="font-size:11px;margin-top:6px">22 de 45 aulas para o 2º grau</div></div>
        <div style="padding:12px"><div class="class-item" style="padding:10px"><div class="hora" style="font-size:15px;min-width:44px">20:30</div><div class="info"><b style="font-size:13px">Avançado</b><small style="font-size:11px">Hammer BSB</small></div></div>
        <div class="class-item infantil" style="padding:10px"><div class="hora" style="font-size:15px;min-width:44px">19:15</div><div class="info"><b style="font-size:13px">Infantil</b><small style="font-size:11px">Hammer BSB</small></div></div></div>
      </a>
    </div></section>

    <section class="section" id="regras"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">Respeito ao tatame</div><h2>Regras do tatame</h2></div></div>
      <ol class="regras">${DB.regras.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
    </div></section>

    <section class="section alt faq" id="faq"><div class="wrap" style="max-width:820px">
      <div class="section-head"><div><div class="eyebrow">Dúvidas</div><h2>Perguntas frequentes</h2></div></div>
      ${[
        ['Nunca treinei. Posso começar?', 'Sim! A maioria dos alunos começou do zero. A aula experimental é grátis e você treina no seu ritmo.'],
        ['Preciso ter kimono?', 'Na primeira aula não. Venha com roupa confortável. Depois indicamos onde comprar (branco, azul ou preto).'],
        ['A partir de que idade a criança pode treinar?', 'Idade mínima a confirmar com o professor. As turmas infantis são separadas por faixa etária.'],
        ['Como funciona o pagamento?', 'Pelo app: você gera o Pix da mensalidade e o pagamento é confirmado automaticamente, sem precisar mandar comprovante.'],
        ['Como marco presença?', 'Agende a aula pelo app e, no tatame, escaneie o QR code do professor. Pronto: a aula conta para sua graduação.']
      ].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
    </div></section>

    <section class="cta-final">
      <h2>Seu primeiro treino<br>é por nossa conta</h2>
      <p style="opacity:.85;margin:14px 0 26px">Agende em 1 minuto — confirmação automática e lembrete no WhatsApp.</p>
      <button class="btn btn-primary" data-exp>${ic('cal', 20)} Agendar aula experimental</button>
    </section>

    <footer class="site-footer"><div class="wrap">
      <div><b style="color:var(--cream)">THE WAY</b> · Escola de Jiu-jitsu brasileiro · Brasília/DF<br>
        <a href="${DB.escola.instagram}" target="_blank" rel="noopener">Instagram @thewaybjj</a></div>
      <div class="ver">Protótipo v${App.VERSAO}</div>
    </div></footer>`;
  }

  function mount(root) {
    $('#menu-btn', root).onclick = () => $('#site-nav', root).classList.toggle('open');
    $$('#site-nav a', root).forEach((a) => a.addEventListener('click', () => $('#site-nav', root).classList.remove('open')));
    $$('[data-exp]', root).forEach((b) => b.onclick = () => { App.Agente.toggle(true); setTimeout(() => App.Agente.usuario('Aula experimental'), 900); });
    $('#btn-instalar', root).onclick = App.instalar;
    const atualizar = () => {
      $('#grade-box', root).innerHTML = gradeHTML();
      $$('#f-unid .filter', root).forEach((b) => b.classList.toggle('on', b.dataset.u === filtroUnidade));
      $$('#f-pub .filter', root).forEach((b) => b.classList.toggle('on', b.dataset.p === filtroPublico));
    };
    $$('#f-unid .filter', root).forEach((b) => b.onclick = () => { filtroUnidade = b.dataset.u; atualizar(); });
    $$('#f-pub .filter', root).forEach((b) => b.onclick = () => { filtroPublico = b.dataset.p; atualizar(); });
  }

  return { render, mount };
})();
