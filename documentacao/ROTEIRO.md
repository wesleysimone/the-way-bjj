# Roteiro do projeto

## Decisões tomadas

- **PWA própria** (não app de loja, não continuar no BJJ Control). Motivos: sem taxa de loja, uma base de código, atualização instantânea, marca própria.
- **Cores do logo prevalecem:** azul-petróleo `#224B66`, creme `#F4F0E4`, preto `#0B0F13`.
- Site, app do aluno e painel do professor são **um único sistema**.

## Fases

| Fase | Entrega | Status |
|---|---|---|
| 0 | Protótipo navegável para o professor aprovar | ✅ publicado (v0.1.0) |
| 1 | Ajustes do protótipo com as sugestões do professor | ⏳ aguardando feedback |
| 2 | MVP real: login, grade/agenda, check-in QR, graduação, painel, Pix com baixa manual no painel | — |
| 3 | Pix automático (gateway + webhook) + lembretes | — |
| 4 | Agente de IA: chat do site → WhatsApp oficial → Instagram | — |
| 5 | Ranking, galeria, loja, migração dos dados do BJJ Control | — |

## Stack sugerida para o sistema real

- **Next.js** (site + PWA) hospedado na Vercel (plano pago para uso comercial) ou na Cloudflare.
- **Supabase**: login, banco Postgres, arquivos (fotos), funções e agendador.
- **Gateway Pix:** Asaas / Mercado Pago / Efí (comparar taxas).
- **WhatsApp Business Platform** (oficial) + **Claude (Anthropic)** para o agente.

## A confirmar com o professor

- [ ] Endereço de cada unidade (Hammer BSB, Gladius, Vicente Pires) e qual é a do Linktree
- [ ] Grade real de cada unidade (a do protótipo é exemplo)
- [ ] Preços: infantil, família, matrícula, avulsa
- [ ] Regras de graduação (aulas por grau em cada faixa, tempo mínimo)
- [ ] Nomes, fotos e textos dos professores; história da escola
- [ ] Número de WhatsApp que será da escola (para a API oficial)
- [ ] Quantos alunos tem hoje e quanto paga no BJJ Control
- [ ] Se dá para exportar os dados do BJJ Control
- [ ] Idade mínima no infantil
- [ ] Logo original em alta resolução / vetor (o protótipo usa a foto do Instagram, que é pequena)
- [ ] Domínio (ex.: thewaybjj.com.br)
