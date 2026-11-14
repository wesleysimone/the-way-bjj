# Como funciona

## 1. O link para o professor

O protótipo fica publicado no **GitHub Pages**, que é grátis:

**https://wesleysimone.github.io/the-way-bjj/**

- O link **não expira**: fica no ar 24h, 7 dias, quanto tempo for preciso. Para tirar do ar é só desligar o Pages (veja abaixo).
- Funciona no celular e no computador, sem login.
- **O professor NÃO precisa baixar nem instalar nada.** É só tocar no link, que abre no navegador do celular. Instalar (“Adicionar à tela inicial”) é opcional, só se ele quiser ver como fica o ícone de app.
- No topo há uma **barra amarela** que troca entre as 3 visões: **Site**, **App do aluno** e **Painel do professor**.
- O site está marcado como `noindex`, então não aparece no Google enquanto for protótipo.

### Como o professor dá ideias (botão “💡 Sugerir ajuste”)

**Jeito 1: escrever direto.** Ele toca no botão, escreve e salva. O sistema anota em qual tela ele estava.

**Jeito 2: marcar na tela** (o mais útil):
1. Ele toca em **“🎯 Marcar na tela o que quer mudar”**.
2. A tela fica em modo de seleção, com uma barra amarela no topo. Ele toca no ponto que quer mudar, por exemplo um horário da **terça na Hammer BSB**.
3. O sistema grava o **rastro**: tela › seção › item tocado › filtros ativos. Exemplo: *Horários › Terça › “06:00 · No-Gi · Hammer BSB” (Filtros: Hammer BSB)*.
4. Ele escreve o pedido (“incluir horário na terça às 7h”) e salva. O item fica com **contorno tracejado amarelo**, para ele ver o que já anotou.

**Nada se perde:** cada sugestão e até o **rascunho** que ele está digitando ficam salvos na hora, no celular dele. Se a página fechar, é só abrir de novo.

**Enviar:** “Enviar todas pelo WhatsApp” abre o WhatsApp com tudo **formatado**, para você me repassar e eu aplicar:

```
*1. Site*
📍 Onde: Horários › Terça › “06:00 · No-Gi · Hammer BSB”
🔎 Filtros: Hammer BSB, Todos
✏️ Pedido: Incluir horário na terça às 7h
🧭 Ref: #/site/grade | #grade… > div.slot…   ← referência técnica para eu achar no código
```

### Listas de sugestões (v0.4.0)
- As sugestões ficam numa **lista** (lista 1, lista 2…). Cada pedido é salvo na hora, e o rascunho também.
- **💾 Salvar e continuar depois:** fecha e mantém tudo. Ao voltar, a lista e o rascunho estão lá, mesmo depois de fechar o navegador.
- **✎ / ✕:** editar ou apagar um pedido da lista.
- **✅ Finalizar e enviar:** abre o WhatsApp com tudo formatado, **arquiva a lista no histórico** e já abre a próxima lista para novos pedidos.
- **📦 Listas enviadas:** **Reenviar** (se a mensagem não chegou) ou **Reabrir** (copia os pedidos para a lista atual, para ajustar e mandar de novo).
- Toda lista enviada leva no final um **relatório técnico** curto: versão, aparelho, navegador e erros que aconteceram. Ajuda a achar falhas.

## Os testes ficam salvos?

**Sim, no aparelho e no navegador de quem está testando.** Fica tudo guardado mesmo fechando a página ou reiniciando o celular:

| O quê | Onde fica |
|---|---|
| Sugestões (lista atual, rascunho e listas enviadas) | celular de quem testa |
| Aulas experimentais agendadas pelo assistente | celular de quem testa (aparecem no Painel › Aulas experimentais) |
| Rostos cadastrados (só a “assinatura”, não a foto) | celular de quem testa |
| **Fotos da turma + quem teve presença/falta** | celular de quem testa (Painel › **Presenças & fotos**) |
| Agendamentos, check-ins, pagamentos simulados | celular de quem testa |
| Registro de testes (ações e **erros**) | celular de quem testa |

**Limites do protótipo:** o que o professor testa no celular dele **não aparece** no seu, e vice-versa: não há servidor ainda. Se ele limpar os dados do navegador ou usar aba anônima, apaga. No sistema real, tudo vai para o banco de dados na nuvem.

### Botão “🧪 Testes” (barra amarela)
Mostra **o que está salvo neste aparelho** (contagem de cada item), a versão e o aparelho, e o **registro** das últimas ações e erros. Tem dois botões:
- **Enviar relatório de teste:** manda tudo pelo WhatsApp, para eu investigar uma falha.
- **Zerar demonstração:** apaga os dados de teste e **mantém as sugestões**.

> No sistema final, as sugestões e mensagens vão direto para o banco de dados, sem passar pelo WhatsApp.

### Tirar o link do ar (se quiser)

No GitHub: repositório `the-way-bjj` → **Settings → Pages** → desativar.
Também dá para deixar o repositório privado, mas no plano grátis o Pages só funciona com repositório público.

## 2. PWA: “se ele instalar, as mudanças aparecem?”

**Sim.** O app instalado é o próprio site, e não existe uma cópia separada.

Como foi feito (`prototipo/sw.js` + `prototipo/js/core.js`):

1. **Rede primeiro, sem cache.** Com internet, todo arquivo é buscado da versão mais nova publicada (`cache: 'no-store'`). Por isso uma mudança publicada aparece na próxima abertura do app.
2. **Detecção de versão nova.** Quando o app volta para a tela (ou a cada 1 minuto), ele pergunta ao servidor se há versão nova do `sw.js`. Se houver, instala na hora (`skipWaiting`), **recarrega sozinho** e mostra o aviso “✨ App atualizado”.
3. **Offline.** Sem internet, o app abre com a última versão salva.

Ninguém precisa reinstalar nem ir à loja de aplicativos.

**Ao publicar uma mudança grande**, aumente o número em `VERSION` no `sw.js` (e `VERSAO` no `core.js`). Isso força a troca imediata em todos os celulares.

### Instalar no celular

- **Android (Chrome):** menu ⋮ → “Instalar app”. O protótipo também mostra o botão “Instalar”.
- **iPhone (Safari):** Compartilhar ↑ → “Adicionar à Tela de Início”.
- Ao abrir pelo ícone, a barra amarela do protótipo some e ele parece um app de verdade.

## 3. GitHub: quando enviar?

**Desde já, a cada etapa.** Enviar cedo:
- dá backup do trabalho;
- **atualiza o link do professor sozinho** (o GitHub Actions publica em ~1 minuto após o `git push`);
- guarda o histórico de cada versão mostrada a ele.

Fluxo:

```bash
git add -A
git commit -m "descrição da mudança"
git push
```

Em ~1 minuto o link é atualizado. Quem estiver com o app instalado recebe a mudança na próxima vez que abrir.

### O que NÃO vai para o GitHub

Está no `.gitignore`: a pasta `Fotos app/` (prints com nomes e fotos de alunos reais) e as configurações locais (`.claude/`).
Chaves de API (Pix, WhatsApp, IA) **nunca** vão para o repositório: no sistema final ficam em variáveis de ambiente.
