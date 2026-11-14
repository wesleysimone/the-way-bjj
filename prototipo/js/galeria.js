/* Histórico de presenças + fotos da turma (fica salvo NESTE aparelho, no IndexedDB do navegador).
 * Cada confirmação de "Foto da turma" guarda: a foto (com as marcações), data/hora, aula,
 * quem teve presença, quem faltou e visitantes. Serve para o professor conferir e para acharmos falhas nos testes.
 * No sistema real isso vai para o banco de dados/armazenamento na nuvem.
 */
window.Galeria = (function () {
  const BANCO = 'theway', TABELA = 'presencas';
  let conexao = null;

  function abrir() {
    if (conexao) return conexao;
    conexao = new Promise((ok, erro) => {
      if (!('indexedDB' in window)) return erro(new Error('Navegador sem IndexedDB'));
      const req = indexedDB.open(BANCO, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(TABELA, { keyPath: 'id', autoIncrement: true });
      req.onsuccess = () => ok(req.result);
      req.onerror = () => { conexao = null; erro(req.error); };
    });
    return conexao;
  }
  async function tx(modo, fn) {
    const db = await abrir();
    return new Promise((ok, erro) => {
      const t = db.transaction(TABELA, modo); const s = t.objectStore(TABELA);
      const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error);
    });
  }

  async function salvar(registro) {
    try {
      const id = await tx('readwrite', (s) => s.add({ ...registro, em: new Date().toISOString() }));
      App.registrar('acao', `Presença pela foto salva: ${registro.presentes.length} presentes, ${registro.faltas.length} faltas`);
      return id;
    } catch (e) { App.registrar('erro', 'Galeria.salvar: ' + e.message); App.toast('Não consegui salvar a foto neste aparelho'); }
  }
  async function listar() {
    try { const l = await tx('readonly', (s) => s.getAll()); return (l || []).sort((a, b) => b.em.localeCompare(a.em)); }
    catch (e) { App.registrar('erro', 'Galeria.listar: ' + e.message); return []; }
  }
  const apagar = (id) => tx('readwrite', (s) => s.delete(id));
  const limpar = () => tx('readwrite', (s) => s.clear());
  async function contar() { try { return await tx('readonly', (s) => s.count()); } catch (e) { return 0; } }

  return { salvar, listar, apagar, limpar, contar };
})();
