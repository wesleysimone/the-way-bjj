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
  function fotoDaTurma(aoConfirmar) {
    modal(`
      <h3>${ic('camera')} Foto da turma → presença</h3>
      <p class="a-muted" style="margin-top:0">Tire ou envie a foto do fim da aula. O sistema reconhece quem está nela e marca a presença.</p>
      <label class="btn btn-primary btn-block">${ic('camera', 18)} Tirar / escolher foto<input type="file" accept="image/*" capture="environment" id="ft-file" hidden></label>
      <div id="ft-status" class="a-muted" style="text-align:center;margin:10px 0;font-size:14px">${cadastrados().length ? `${cadastrados().length} rosto(s) cadastrado(s) neste aparelho` : 'Nenhum rosto cadastrado ainda — cadastre no App do aluno › Perfil, ou ensine aqui depois da foto.'}</div>
      <div id="ft-resultado"></div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fechar</button>
    `, (m, fechar) => {
      const status = $('#ft-status', m), res = $('#ft-resultado', m);
      $('#ft-file', m).onchange = async (e) => {
        const arq = e.target.files[0]; if (!arq) return;
        try {
          const f = await carregar((t) => status.textContent = t);
          status.textContent = 'Procurando rostos na foto…';
          const canvas = await arquivoParaImagem(arq);
          const achados = await f.detectAllFaces(canvas, new f.SsdMobilenetv1Options({ minConfidence: 0.35 })).withFaceLandmarks().withFaceDescriptors();
          const b = base();
          const rotulados = Object.entries(b).map(([n, ds]) => new f.LabeledFaceDescriptors(n, ds.map((d) => new Float32Array(d))));
          const matcher = rotulados.length ? new f.FaceMatcher(rotulados, LIMIAR) : null;
          const usados = new Set();
          const lista = achados.map((a, i) => {
            let nome = null, conf = 0;
            if (matcher) { const best = matcher.findBestMatch(a.descriptor); if (best.label !== 'unknown' && !usados.has(best.label)) { nome = best.label; conf = 1 - best.distance; usados.add(nome); } }
            return { i, box: a.detection.box, descritor: a.descriptor, nome, conf };
          });
          desenhar(canvas, lista);
          status.innerHTML = `<b>${achados.length}</b> rosto(s) na foto · <b style="color:var(--ok)">${lista.filter((x) => x.nome).length}</b> reconhecido(s)`;
          mostrar(res, canvas, lista, fechar, aoConfirmar);
        } catch (err) { status.textContent = 'Erro: ' + err.message; }
        e.target.value = '';
      };
    });
  }

  function desenhar(canvas, lista) {
    const ctx = canvas.getContext('2d'); const lw = Math.max(3, canvas.width / 300);
    lista.forEach((x) => {
      const { x: X, y: Y, width: W, height: H } = x.box;
      ctx.lineWidth = lw; ctx.strokeStyle = x.nome ? '#2FA36B' : '#E0A526'; ctx.strokeRect(X, Y, W, H);
      const tag = x.nome ? x.nome.split(' ')[0] : '?' + (x.i + 1);
      ctx.font = `bold ${Math.max(14, W / 5)}px Inter, sans-serif`;
      const tw = ctx.measureText(tag).width + 12, th = Math.max(20, W / 4);
      ctx.fillStyle = x.nome ? '#2FA36B' : '#E0A526'; ctx.fillRect(X, Y - th, tw, th);
      ctx.fillStyle = '#fff'; ctx.fillText(tag, X + 6, Y - th * 0.25);
    });
  }

  function mostrar(res, canvas, lista, fechar, aoConfirmar) {
    const nomes = [DB.eu.nome, ...DB.alunos.map((a) => a.nome)];
    canvas.style.cssText = 'width:100%;border-radius:12px;margin-bottom:10px';
    res.innerHTML = '';
    res.appendChild(canvas);
    const box = document.createElement('div');
    box.innerHTML = lista.length ? lista.map((x) => `
      <div class="ft-item"><div class="av" style="background:${x.nome ? 'var(--ok)' : '#E0A526'};color:#fff">${x.nome ? iniciais(x.nome) : '?' + (x.i + 1)}</div>
        <div style="flex:1;min-width:0">${x.nome ? `<b>${esc(x.nome)}</b><div class="a-muted" style="font-size:12px">reconhecido · ${Math.round(x.conf * 100)}% parecido</div>`
          : `<select data-ensinar="${x.i}"><option value="">Quem é o rosto ?${x.i + 1}?</option>${nomes.map((n) => `<option>${esc(n)}</option>`).join('')}</select>`}</div>
        ${x.nome ? `<input type="checkbox" checked data-pres="${x.i}" style="width:22px;height:22px">` : ''}</div>`).join('')
      : '<p class="a-muted">Nenhum rosto encontrado. Tente uma foto com mais luz e rostos de frente.</p>';
    res.appendChild(box);
    if (lista.length) {
      const b = document.createElement('button'); b.className = 'btn btn-primary btn-block'; b.style.marginTop = '10px';
      b.textContent = 'Confirmar presença'; res.appendChild(b);
      b.onclick = () => {
        // rostos ensinados agora: o sistema aprende para as próximas fotos
        $$('[data-ensinar]', box).forEach((s) => { if (s.value) { const x = lista[+s.dataset.ensinar]; salvarRosto(s.value, x.descritor); x.nome = s.value; } });
        const presentes = lista.filter((x) => x.nome && (!$(`[data-pres="${x.i}"]`, box) || $(`[data-pres="${x.i}"]`, box).checked)).map((x) => x.nome);
        aoConfirmar && aoConfirmar(presentes);
        fechar();
        toast(`✅ Presença de ${presentes.length} aluno(s) registrada. Foto enviada para a galeria.`, 3500);
      };
    }
  }

  return { carregar, cadastrar, fotoDaTurma, cadastrados, apagar, base };
})();
