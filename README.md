# THE WAY — Site + App (PWA) + Painel do professor

Projeto da escola de Jiu-jitsu **THE WAY** (@thewaybjj, Brasília).
Objetivo: substituir o app genérico (BJJ Control) por um sistema próprio, com a marca da escola, que **automatiza** agenda, presença, graduação, cobrança por Pix e atendimento (aula experimental) com um **agente de IA**.

## Estrutura

| Pasta | O que é |
|---|---|
| `prototipo/` | Protótipo navegável (HTML/CSS/JS puro). É o que vai no link para o professor aprovar. |
| `documentacao/` | Como funciona o link, o PWA, o GitHub, o agente e o roteiro do projeto. |
| `Fotos app/` | Prints do app atual (BJJ Control) — **não vai para o GitHub** (tem dados de alunos). |
| `.github/workflows/` | Publicação automática do protótipo no GitHub Pages a cada `git push`. |

## Links

- Protótipo: https://wesleysimone.github.io/the-way-bjj/
- Visões: Site (`#/`), App do aluno (`#/app/inicio`), Painel do professor (`#/admin/hoje`)

## Rodar no computador

```bash
python -m http.server 5173 --directory prototipo
```

Abrir http://localhost:5173

## Documentos

- [Como funciona (link, PWA, atualizações, sugestões)](documentacao/COMO-FUNCIONA.md)
- [Agente de IA e automações](documentacao/AGENTE-E-AUTOMACOES.md)
- [Roteiro do projeto e pendências](documentacao/ROTEIRO.md)
- [Mensagem pronta para o professor](documentacao/MENSAGEM-PROFESSOR.md)
