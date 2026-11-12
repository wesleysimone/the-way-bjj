# Como funciona

## 1. O link para o professor

O protótipo fica publicado no **GitHub Pages**, que é grátis:

**https://wesleysimone.github.io/the-way-bjj/**

- O link **não expira**: fica no ar 24h, 7 dias, quanto tempo for preciso. Para tirar do ar é só desligar o Pages (veja abaixo).
- Funciona no celular e no computador, sem login.
- No topo há uma **barra amarela** que troca entre as 3 visões: **Site**, **App do aluno** e **Painel do professor**.
- O site está marcado como `noindex`, então não aparece no Google enquanto for protótipo.

### Como o professor dá ideias

1. Na barra amarela, ele toca em **“💡 Sugerir ajuste”**.
2. Escreve a ideia. O sistema já anota em qual tela ele estava.
3. Pode salvar várias sugestões, que ficam guardadas no celular dele.
4. No fim, toca em **“Enviar todas pelo WhatsApp”**. Abre o WhatsApp com a lista pronta, e ele escolhe o seu contato e envia.

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
