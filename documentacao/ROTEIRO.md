# Roteiro do projeto

## Decisões tomadas

- **PWA própria** (não app de loja, não continuar no BJJ Control). Motivos: sem taxa de loja, uma base de código, atualização instantânea, marca própria.
- **Cores do logo prevalecem:** azul-petróleo `#224B66`, creme `#F4F0E4`, preto `#0B0F13`.
- Site, app do aluno e painel do professor são **um único sistema**.
- **Valores (informados pelo Wesley):** adulto **R$ 150/mês**, filho de aluno **R$ 100/mês** (regra exata do desconto a confirmar). Pagamento: **Pix** por enquanto. Outras formas (cartão, boleto, recorrência) **a definir**.
- **Presença:** agendamento + **foto da turma com reconhecimento facial** (ver [RECONHECIMENTO-FACIAL.md](RECONHECIMENTO-FACIAL.md)), com QR/toque manual como alternativa.

## Fases

| Fase | Entrega | Status |
|---|---|---|
| 0 | Protótipo navegável para o professor aprovar | ✅ publicado (v0.1.0) |
| 0.2 | Valores 150/100, “Como chegar” no Maps, sugestões com marcação na tela, reconhecimento facial | ✅ publicado (v0.2.0) |
| 0.3 | Presença pela foto independente de agendamento (faltas, “veio sem agendar”, professor, visitante), detecção em pedaços (24/24 na foto real), foto vinda do WhatsApp/galeria, mostrar/esconder valores no site, mensagem com decisões para o professor | ✅ publicado (v0.3.0) |
| 0.4 | Logo oficial em alta (ícones e site com as cores exatas), listas de sugestões (salvar, finalizar e enviar, histórico), histórico de fotos da turma e presenças, painel 🧪 Testes com registro de erros | ✅ publicado (v0.4.0) |
| 0.5 | Central de sugestões colaborativa (nº, solicitante, situação, apoio contra duplicidade, envio, aprovação, travas) + base compartilhada Supabase pronta (falta criar o projeto) + teste automático (28–30 casos, visual, sem alterar dados) + teste manual acompanhado com relatório | ✅ publicado (v0.5.0) |
| 0.5.1 | Base compartilhada trocada para **MySQL + PHP** (sem mensalidade extra; roda em HostGator/Hostinger). API testada (39/39) e site ligado a ela | ✅ publicado (v0.5.1) |
| 0.5.2 | Correções achadas na verificação: janelas da central de sugestões ficavam atrás dela (Enviar e Administrador não respondiam); confirmações agora são do próprio app (a do navegador some no app instalado); WhatsApp abre no toque; instruções de instalar no computador; teste automático do Enviar (29/29) | ✅ publicado (v0.5.2) |
| 1 | Ajustes do protótipo com as sugestões do professor | ⏳ aguardando feedback |
| 2 | MVP real: login, grade/agenda, check-in QR, graduação, painel, Pix com baixa manual no painel | — |
| 3 | Pix automático (gateway + webhook) + lembretes | — |
| 4 | Agente de IA: chat do site → WhatsApp oficial → Instagram | — |
| 5 | Ranking, galeria, loja, migração dos dados do BJJ Control | — |

## Stack sugerida para o sistema real

- **Next.js** (site + PWA) hospedado na Vercel (plano pago para uso comercial) ou na Cloudflare.
- **Hospedagem com PHP + MySQL** (HostGator ou Hostinger): site, API em PHP e banco MySQL, sem mensalidade extra além do plano. Decisão do Wesley de 17/11/2026: nada de Supabase.
- **Gateway Pix:** Asaas / Mercado Pago / Efí (comparar taxas).
- **WhatsApp Business Platform** (oficial) + **Claude (Anthropic)** para o agente.

## Pendente com o Wesley

- [ ] Contratar a hospedagem (HostGator ou Hostinger), criar o banco MySQL e subir a pasta `servidor/` (documentacao/BASE-MYSQL.md) para a lista de sugestões ficar compartilhada
- [ ] Definir os códigos da equipe e do administrador

## A confirmar com o professor

- [ ] Endereço de cada unidade (Hammer BSB, Gladius, Vicente Pires) e qual é a do Linktree
- [ ] Grade real de cada unidade (a do protótipo é exemplo)
- [ ] Preços: confirmar regra do filho (R$ 100) e definir infantil sem responsável, matrícula, avulsa
- [ ] Formas de pagamento além do Pix
- [x] Foto real de fim de aula testada (24/24 rostos)
- [ ] Consentimento LGPD para biometria (texto final) e uso de fotos de menores
- [ ] Regras de graduação (aulas por grau em cada faixa, tempo mínimo)
- [ ] Nomes, fotos e textos dos professores; história da escola
- [ ] Número de WhatsApp que será da escola (para a API oficial)
- [ ] Quantos alunos tem hoje e quanto paga no BJJ Control
- [ ] Se dá para exportar os dados do BJJ Control
- [ ] Idade mínima no infantil
- [x] Logo em alta resolução recebido (Logo Azul.jpeg, 1196×1600). Se houver vetor (PDF/AI/SVG), melhor ainda para impressão
- [ ] Domínio (ex.: thewaybjj.com.br)
