# Agente de IA e automações

Objetivo: o professor **não precisar responder WhatsApp** para tarefas repetitivas, como agendar aula experimental, passar horários, cobrar mensalidade e lembrar aula.

No protótipo, o agente é **simulado**: é o balão azul no canto do site, com respostas roteirizadas. Ele já mostra o fluxo completo: o interessado agenda e a aula aparece em *Painel → Aulas experimentais*.

## Arquitetura proposta (sistema real)

```
 WhatsApp (número da escola) ─┐
 Instagram Direct ────────────┼──► Webhook (Supabase Edge Function) ──► Agente (Claude via API)
 Chat do site/app ────────────┘                                            │  usa ferramentas:
                                                                            ├─ consultar_grade(dia, unidade)
                                                                            ├─ verificar_vagas(aula)
                                                                            ├─ agendar_experimental(nome, tel, aula)
                                                                            ├─ consultar_aluno(telefone)
                                                                            ├─ gerar_pix(aluno, mês)
                                                                            └─ chamar_professor(motivo)
                                                                                     │
                     Banco de dados (Supabase/Postgres) ◄────────────────────────────┘
                              ▲
 Agendador (cron, a cada 5 min) ──► lembretes, cobranças, aluno sumido, pós-experimental
 Gateway Pix (Asaas / Mercado Pago / Efí) ──► webhook “pago” ──► baixa automática + recibo
```

- **A base de conhecimento é o próprio sistema.** Grade, unidades, planos e regras vêm do banco. Se o professor muda um horário no painel, o agente já responde certo.
- **O agente nunca inventa.** Se não souber, chama o professor (notificação no painel/WhatsApp dele) e avisa a pessoa.
- **Tom de voz** da escola: “Oss”, direto, acolhedor. Ajustamos com o professor.

## Automações previstas (o professor liga/desliga no painel)

| Automação | Gatilho | Canal |
|---|---|---|
| Aula experimental automática | Pessoa pede no site/WhatsApp/Instagram | WhatsApp + site |
| Confirmação + endereço + o que levar | Logo após agendar | WhatsApp |
| Lembrete de aula | 2h antes (botões “vou” / “não vou”) | Push + WhatsApp |
| Pós-aula experimental | Dia seguinte: “como foi?” + planos | WhatsApp |
| Cobrança | 3 dias antes do vencimento, com Pix | WhatsApp + app |
| Atraso | 1, 5 e 10 dias após vencer (tom gentil) | WhatsApp |
| Aluno sumido | 10 dias sem treinar; avisa o professor aos 21 | WhatsApp |
| Pronto para graduar | Completou as aulas do grau | Painel |
| Parabéns pela graduação | Professor clica “Graduar” | App + WhatsApp |
| Aniversário | Data de nascimento | WhatsApp |
| Foto da turma | Professor envia no app | Galeria + quem treinou |

## WhatsApp: pontos importantes

1. **Usar a API oficial** (WhatsApp Business Platform / Cloud API da Meta), com um número só da escola.
   **Não usar** robôs que simulam o WhatsApp Web: o número pode ser **banido**.
2. Mensagens que **a escola inicia** (lembrete, cobrança) fora de 24h depois da última mensagem do aluno precisam de **modelos (templates) aprovados pela Meta**, que são cobrados por mensagem. As respostas dentro da janela de 24h são mais baratas ou grátis, conforme a regra vigente da Meta. Vamos levantar o custo atual antes de implementar.
3. Pode ser preciso verificar a empresa (CNPJ) no Meta Business. Confirmar com o professor.
4. Push do app (grátis) e e-mail podem substituir parte das mensagens de WhatsApp para baixar o custo.

## Pix com baixa automática

- Gateway com **Pix + webhook** (Asaas, Mercado Pago ou Efí). Cada mensalidade gera um Pix com identificador próprio. Quando o aluno paga, o gateway avisa o sistema e a baixa é automática.
- **Pix Automático** (recorrente, autorizado uma vez pelo aluno) é a opção mais próxima de “débito automático”. Confirmar se o gateway escolhido já oferece.
- Taxa por Pix recebido varia por gateway: comparar antes de escolher.

## LGPD

- Termo de uso e consentimento no cadastro.
- **Menores (infantil):** consentimento do responsável, inclusive para **fotos**.
- O aluno pode pedir exclusão dos dados.
- O agente só acessa os dados do próprio contato que está conversando.

## Ordem de implementação sugerida

1. Agente no **chat do site** (mais simples, sem custo de WhatsApp) → valida as respostas.
2. **WhatsApp oficial**: aula experimental + confirmação.
3. Lembretes e cobrança (templates aprovados).
4. Instagram Direct.
