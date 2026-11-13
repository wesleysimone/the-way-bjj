/* Reconhecimento facial (protótipo FUNCIONAL, roda 100% no navegador).
 *
 * 1) Aluno cadastra o rosto no app (frente, lado esquerdo, lado direito).
 *    Guardamos só a "assinatura" do rosto (128 números), não a foto.
 * 2) No fim da aula o professor tira/enviar a FOTO DA TURMA no painel.
 *    O sistema acha todos os rostos, compara com os cadastrados e marca a presença.
 * 3) Rosto não reconhecido → o professor diz quem é uma vez, e o sistema aprende.
 *
 * Biblioteca: @vladmandic/face-api (TensorFlow.js), carregada só quando precisa (~13 MB na 1ª vez, depois fica em cache).
 * No protótipo os rostos ficam guardados NESTE aparelho. No sistema real: banco de dados, com consentimento (LGPD).
 */
window.Rosto = (function () {
  const { ic, esc, store, toast, modal, $, $$, iniciais, corAv } = App;
  const LIB = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';
  const MODELOS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
  const LIMIAR = 0.5; // distância máxima para considerar a mesma pessoa (menor = mais rigoroso)
  let pronto = null;

  // ---------- base de rostos (por nome) ----------
  const base = () => store.get('rostos', {});           // { "Nome": [[128], [128], ...] }
  function salvarRosto(nome, descritor) {
    const b = base(); (b[nome] = b[nome] || []).push(Array.from(descritor)); store.set('rostos', b);
  }
  const cadastrados = () => Object.keys(base());

  function carregar(aoProgredir = () => {}) {
    if (pronto) return pronto;
    pronto = new Promise((ok, erro) => {
      aoProgredir('Baixando reconhecimento facial…');
      const s = document.createElement('script'); s.src = LIB; s.crossOrigin = 'anonymous';
      s.onload = async () => {
        try {
          const f = window.faceapi;
          aoProgredir('Preparando modelos (só na primeira vez)…');
          await Promise.all([
            f.nets.tinyFaceDetector.loadFromUri(MODELOS),
            f.nets.ssdMobilenetv1.loadFromUri(MODELOS),
            f.nets.faceLandmark68Net.loadFromUri(MODELOS),
            f.nets.faceRecognitionNet.loadFromUri(MODELOS)
          ]);
          ok(f);
        } catch (e) { pronto = null; erro(e); }
      };
      s.onerror = () => { pronto = null; erro(new Error('Sem internet para baixar a biblioteca')); };
      document.head.appendChild(s);
    });
    return pronto;
  }

  // virada do rosto: <0 olhando para um lado, >0 para o outro, ~0 de frente
  function virada(lm) {
    const p = lm.positions, olhoE = p[36], olhoD = p[45], nariz = p[30];
    const meio = (olhoE.x + olhoD.x) / 2, dist = Math.abs(olhoD.x - olhoE.x) || 1;
    return (nariz.x - meio) / dist;
  }

  // ======================= CADASTRO DO ROSTO (app do aluno) =======================
  const ETAPAS = [
    { id: 'frente', nome: 'De frente', dica: 'Olhe direto para a câmera', ok: (v) => Math.abs(v) < 0.12 },
    { id: 'esq', nome: 'Virado para um lado', dica: 'Vire o rosto um pouco para a esquerda', ok: (v) => Math.abs(v) >= 0.08 },
    { id: 'dir', nome: 'Virado para o outro lado', dica: 'Agora vire um pouco para a direita', ok: (v) => Math.abs(v) >= 0.08 }
  ];

  function cadastrar(nome, aoTerminar) {
    let etapa = 0, stream = null, vira = null;
    const parar = () => stream && stream.getTracks().forEach((t) => t.stop());
    modal(`
      <h3>${ic('camera')} Cadastro do rosto</h3>
      <p class="a-muted" style="margin-top:0">Para o professor marcar sua presença pela <b>foto da turma</b>. São 3 fotos rápidas.</p>
      <label class="a-row" style="gap:10px;align-items:flex-start;font-weight:500;font-size:13px;background:var(--app-bg);padding:10px;border-radius:12px">
        <input type="checkbox" id="rs-ok" style="width:20px;height:20px;margin:2px 0 0;flex-shrink:0">
        <span>Autorizo a THE WAY a usar a biometria do meu rosto <b>só para registrar presença</b>. Posso apagar quando quiser. (Menor de idade: autorização do responsável.)</span>
      </label>
      <div class="rs-steps">${ETAPAS.map((e, i) => `<div class="rs-step" data-i="${i}"><span>${i + 1}</span>${e.nome}</div>`).join('')}</div>
      <div class="rs-cam"><video id="rs-video" playsinline muted></video><div class="rs-oval"></div><div class="rs-status" id="rs-status">Marque a autorização para abrir a câmera</div></div>
      <button class="btn btn-primary btn-block" id="rs-foto" disabled>${ic('camera', 18)} Tirar foto</button>
      <label class="btn btn-ghost btn-block" style="margin-top:8px">Sem câmera? Enviar foto do celular<input type="file" accept="image/*" id="rs-file" hidden></label>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px;border-color:transparent">Cancelar</button>
    `, (m, fechar) => {
      const video = $('#rs-video', m), status = $('#rs-status', m), btn = $('#rs-foto', m);
      const fecharTudo = () => { parar(); fechar(); };
      m.parentElement.addEventListener('click', (e) => { if (e.target === m.parentElement || e.target.closest('[data-close]')) parar(); });
      const marcarEtapas = () => $$('.rs-step', m).forEach((s, i) => { s.classList.toggle('on', i === etapa); s.classList.toggle('feito', i < etapa); });
      marcarEtapas();

      async function abrir() {
        status.textContent = 'Carregando…';
        try {
          await carregar((t) => status.textContent = t);
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
          video.srcObject = stream; await video.play();
          btn.disabled = false; status.textContent = ETAPAS[etapa].dica;
        } catch (e) {
          status.textContent = 'Câmera indisponível — use “Enviar foto do celular”.';
          await carregar((t) => status.textContent = t).catch(() => {});
          btn.disabled = true;
        }
      }
      $('#rs-ok', m).onchange = (e) => { if (e.target.checked) abrir(); else { parar(); btn.disabled = true; } };

      async function processar(fonte) {
        if (!$('#rs-ok', m).checked) { toast('Marque a autorização primeiro'); return; }
        const f = await carregar((t) => status.textContent = t);
        status.textContent = 'Analisando…';
        const r = await f.detectSingleFace(fonte, new f.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })).withFaceLandmarks().withFaceDescriptor();
        if (!r) { status.textContent = '😕 Não achei um rosto. Mais luz e rosto inteiro no oval.'; return; }
        const v = virada(r.landmarks);
        if (!ETAPAS[etapa].ok(v)) { status.textContent = etapa === 0 ? 'Olhe mais de frente e tente de novo' : 'Vire um pouco mais o rosto e tente de novo'; return; }
        salvarRosto(nome, r.descriptor);
        etapa++; marcarEtapas();
        if (etapa >= ETAPAS.length) {
          fecharTudo(); toast('✅ Rosto cadastrado! Agora a foto da turma marca sua presença.', 3500); aoTerminar && aoTerminar();
        } else status.textContent = '✓ Boa! ' + ETAPAS[etapa].dica;
      }
      btn.onclick = () => processar(video);
      $('#rs-file', m).onchange = async (e) => {
        const arq = e.target.files[0]; if (!arq) return;
        processar(await arquivoParaImagem(arq));
        e.target.value = '';
      };
    });
  }

  function arquivoParaImagem(arq, max = 1600) {
    return new Promise((ok) => {
      const url = URL.createObjectURL(arq); const img = new Image();
      img.onload = () => {
        const esc_ = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * esc_; c.height = img.height * esc_;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c);
      };
      img.src = url;
    });
  }

  function apagar(nome) { const b = base(); delete b[nome]; store.set('rostos', b); }

  // ======================= FOTO DA TURMA (painel do professor) =======================
  // A FOTO é a fonte da verdade: quem aparece ganha presença, tenha agendado ou não.
  // Quem agendou e não aparece fica como falta (o professor pode corrigir).
  const PROFESSOR = 'Professor';
  const VISITANTE = 'Visitante / aula experimental';

  // Detecção em "pedaços" (tiles): numa foto de turma os rostos são pequenos (~25 px).
  // Analisar a foto inteira de uma vez perde rostos; em pedaços sobrepostos achou 24 de 24 na foto real de teste.
  async function detectarTurma(f, canvas, aoProgredir) {
    const W = canvas.width, H = canvas.height;
    const T = Math.max(320, Math.min(640, Math.round(Math.min(W, H) / 2))), S = Math.round(T * 0.75);
    const tile = document.createElement('canvas'); tile.width = T; tile.height = T;
    const ctx = tile.getContext('2d');
    const achados = []; let n = 0;
    const total = Math.ceil(Math.max(1, W - T) / S + 1) * Math.ceil(Math.max(1, H - T) / S + 1);
    for (let y = 0; ; y += S) {
      for (let x = 0; ; x += S) {
        const tx = Math.min(x, Math.max(0, W - T)), ty = Math.min(y, Math.max(0, H - T));
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, T, T);
        ctx.drawImage(canvas, tx, ty, T, T, 0, 0, T, T);
        const r = await f.detectAllFaces(tile, new f.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptors();
        r.forEach((a) => { const b = a.detection.box; achados.push({ box: { x: b.x + tx, y: b.y + ty, width: b.width, height: b.height }, score: a.detection.score, descritor: a.descriptor }); });
        aoProgredir && aoProgredir(`Procurando rostos… ${Math.min(99, Math.round(++n / total * 100))}%`);
        if (x + T >= W) break;
      }
      if (y + T >= H) break;
    }
    // remove o mesmo rosto achado em dois pedaços (fica o de maior confiança)
    const sobre = (a, b) => { const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.width, b.x + b.width), y2 = Math.min(a.y + a.height, b.y + b.height); const i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1); return i / Math.min(a.width * a.height, b.width * b.height); };
    achados.sort((a, b) => b.score - a.score);
    const unicos = [];
    achados.forEach((a) => { if (!unicos.some((u) => sobre(u.box, a.box) > 0.4)) unicos.push(a); });
    return unicos.sort((a, b) => (Math.abs(a.box.y - b.box.y) > a.box.height ? a.box.y - b.box.y : a.box.x - b.box.x));
  }

  // cada pessoa no máximo 1 vez: pareia rosto↔pessoa pela menor distância
  function reconhecer(f, rostos) {
    const b = base(); const pares = [];
    rostos.forEach((r, i) => Object.entries(b).forEach(([nome, ds]) => {
      const d = Math.min(...ds.map((x) => f.euclideanDistance(r.descritor, x)));
      if (d < LIMIAR) pares.push({ i, nome, d });
    }));
    pares.sort((a, b) => a.d - b.d);
    const usadoR = new Set(), usadoN = new Set();
    rostos.forEach((r, i) => { r.i = i; r.nome = null; r.conf = 0; });
    pares.forEach((p) => { if (!usadoR.has(p.i) && !usadoN.has(p.nome)) { usadoR.add(p.i); usadoN.add(p.nome); rostos[p.i].nome = p.nome; rostos[p.i].conf = 1 - p.d; } });
    return rostos;
  }

  /* opcoes: { agendados: [nomes], aoConfirmar(presentes, faltas, extras), arquivo } */
  function fotoDaTurma(opcoes = {}) {
    const { agendados = [], aoConfirmar, arquivo } = opcoes;
    modal(`
      <h3>${ic('camera')} Foto da turma → presença</h3>
      <p class="a-muted" style="margin-top:0">A foto manda: <b>quem aparece ganha presença</b>, mesmo sem ter agendado. Quem agendou e não aparece fica como falta.</p>
      <div class="a-row" style="gap:8px">
        <label class="btn btn-primary" style="flex:1;padding:12px 10px">${ic('camera', 18)} Tirar agora<input type="file" accept="image/*" capture="environment" class="ft-file" hidden></label>
        <label class="btn btn-ghost" style="flex:1;padding:12px 10px">🖼️ Galeria / WhatsApp<input type="file" accept="image/*" class="ft-file" hidden></label>
      </div>
      <p class="a-muted" style="font-size:12px;margin:8px 0 0">Dica: no WhatsApp, envie a foto em <b>HD</b> — rostos pequenos são reconhecidos melhor. No Android, com o app instalado, dá para <b>compartilhar a foto do WhatsApp direto para o app The Way</b>.</p>
      <div id="ft-status" class="a-muted" style="text-align:center;margin:10px 0;font-size:14px">${agendados.length} agendado(s) nesta aula · ${cadastrados().length} rosto(s) cadastrado(s)</div>
      <div id="ft-resultado"></div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fechar</button>
    `, (m, fechar) => {
      const status = $('#ft-status', m), res = $('#ft-resultado', m);
      async function processar(arq) {
        try {
          const f = await carregar((t) => status.textContent = t);
          const canvas = await arquivoParaImagem(arq, 2400);
          const rostos = reconhecer(f, await detectarTurma(f, canvas, (t) => status.textContent = t));
          desenhar(canvas, rostos);
          status.innerHTML = `<b>${rostos.length}</b> rosto(s) na foto · <b style="color:var(--ok)">${rostos.filter((x) => x.nome).length}</b> reconhecido(s)`;
          mostrar(res, canvas, rostos, agendados, fechar, aoConfirmar);
        } catch (err) { status.textContent = 'Erro: ' + err.message; }
      }
      $$('.ft-file', m).forEach((inp) => inp.onchange = (e) => { const a = e.target.files[0]; e.target.value = ''; if (a) processar(a); });
      if (arquivo) processar(arquivo);
    });
  }

  function desenhar(canvas, lista) {
    const ctx = canvas.getContext('2d'); const lw = Math.max(2, canvas.width / 400);
    lista.forEach((x) => {
      const { x: X, y: Y, width: W, height: H } = x.box;
      const cor = x.nome === PROFESSOR ? '#224B66' : x.nome ? '#2FA36B' : '#E0A526';
      ctx.lineWidth = lw; ctx.strokeStyle = cor; ctx.strokeRect(X, Y, W, H);
      const tag = x.nome === PROFESSOR ? 'Prof.' : x.nome ? x.nome.split(' ')[0] : String(x.i + 1);
      const fs = Math.max(11, Math.min(W * 0.45, 22));
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      const tw = ctx.measureText(tag).width + 8, th = fs + 6;
      ctx.fillStyle = cor; ctx.fillRect(X, Y - th, tw, th);
      ctx.fillStyle = '#fff'; ctx.fillText(tag, X + 4, Y - 5);
    });
  }

  function mostrar(res, canvas, lista, agendados, fechar, aoConfirmar) {
    const nomesAlunos = [DB.eu.nome, ...DB.eu.dependentes.map((d) => d.nome), ...DB.alunos.map((a) => a.nome)];
    const naFoto = new Set(lista.map((x) => x.nome).filter(Boolean));
    const reconhecidos = lista.filter((x) => x.nome && x.nome !== PROFESSOR);
    const professor = lista.filter((x) => x.nome === PROFESSOR);
    const desconhecidos = lista.filter((x) => !x.nome);
    const ausentes = agendados.filter((n) => !naFoto.has(n));
    canvas.style.cssText = 'width:100%;display:block;cursor:zoom-in';
    canvas.title = 'Toque para ampliar';
    canvas.onclick = () => { canvas.style.width = canvas.style.width === '100%' ? '250%' : '100%'; };
    res.innerHTML = '';
    const wrap = document.createElement('div'); wrap.style.cssText = 'overflow:auto;border-radius:12px;max-height:60vh'; wrap.appendChild(canvas); res.appendChild(wrap);
    const av = (x) => `<div class="av" style="background:${x.nome === PROFESSOR ? 'var(--blue)' : x.nome ? 'var(--ok)' : '#E0A526'};color:#fff">${x.nome === PROFESSOR ? 'P' : x.nome ? iniciais(x.nome) : x.i + 1}</div>`;
    const box = document.createElement('div');
    box.innerHTML = `
      ${reconhecidos.length ? `<div class="a-section-title">✅ Presença (${reconhecidos.length})</div>` + reconhecidos.map((x) => `<div class="ft-item">${av(x)}<div style="flex:1;min-width:0"><b>${esc(x.nome)}</b><div class="a-muted" style="font-size:12px">${agendados.includes(x.nome) ? 'agendou e veio' : '<span style="color:#9a6b00;font-weight:700">veio sem agendar</span> — presença marcada'} · ${Math.round(x.conf * 100)}% parecido</div></div><input type="checkbox" checked data-pres="${x.i}" style="width:22px;height:22px"></div>`).join('') : ''}
      ${professor.length ? `<div class="a-section-title">👊 Professor (não conta presença)</div>` + professor.map((x) => `<div class="ft-item">${av(x)}<b>Professor</b></div>`).join('') : ''}
      ${desconhecidos.length ? `<div class="a-section-title">❓ Quem é? (${desconhecidos.length})</div><p class="a-muted" style="font-size:12px;margin:0 0 4px">Escolha uma vez — o sistema aprende o rosto para as próximas fotos. Toque na foto para ampliar e ver os números.</p>` +
        desconhecidos.map((x) => `<div class="ft-item">${av(x)}<div style="flex:1;min-width:0"><select data-ensinar="${x.i}"><option value="">Rosto ${x.i + 1}: não sei / pular</option><option>${PROFESSOR}</option><option>${VISITANTE}</option>${nomesAlunos.filter((n) => !naFoto.has(n)).map((n) => `<option>${esc(n)}</option>`).join('')}</select></div></div>`).join('') : ''}
      ${ausentes.length ? `<div class="a-section-title">⚠️ Agendou e não está na foto (${ausentes.length})</div>` + ausentes.map((n) => `<div class="ft-item"><div class="av" style="background:#B42323;color:#fff">${iniciais(n)}</div><div style="flex:1"><b>${esc(n)}</b><div class="a-muted" style="font-size:12px">fica como falta · marque se ele estava (saiu da foto)</div></div><input type="checkbox" data-aus="${esc(n)}" style="width:22px;height:22px"></div>`).join('') : ''}
      ${!lista.length ? '<p class="a-muted">Nenhum rosto encontrado. Tente uma foto com mais luz, mais perto e em HD.</p>' : ''}`;
    res.appendChild(box);
    const b = document.createElement('button'); b.className = 'btn btn-primary btn-block'; b.style.marginTop = '12px';
    b.textContent = 'Confirmar presença'; res.appendChild(b);
    b.onclick = () => {
      const extras = [];
      $$('[data-ensinar]', box).forEach((s) => {
        if (!s.value) return;
        const x = lista[+s.dataset.ensinar];
        if (s.value === VISITANTE) { extras.push(VISITANTE); return; } // visitante não é memorizado
        salvarRosto(s.value, x.descritor); x.nome = s.value;             // aprende o rosto
      });
      const presentes = lista.filter((x) => x.nome && x.nome !== PROFESSOR && (!$(`[data-pres="${x.i}"]`, box) || $(`[data-pres="${x.i}"]`, box).checked)).map((x) => x.nome);
      $$('[data-aus]', box).forEach((c) => { if (c.checked) presentes.push(c.dataset.aus); });
      const faltas = agendados.filter((n) => !presentes.includes(n));
      aoConfirmar && aoConfirmar(presentes, faltas, extras);
      fechar();
      toast(`✅ ${presentes.length} presença(s) · ${faltas.length} falta(s)${extras.length ? ` · ${extras.length} visitante(s)` : ''}. Foto na galeria.`, 4000);
    };
  }

  return { carregar, cadastrar, fotoDaTurma, cadastrados, apagar, base, PROFESSOR };
})();
