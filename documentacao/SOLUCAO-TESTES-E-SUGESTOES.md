# Ferramentas de testes e sugestões: solução técnica (v0.5.0)

> **Atualização 17/11/2026 (v0.5.1):** a base compartilhada passou a ser **MySQL + API em PHP** (pasta `servidor/`), sem mensalidade extra e pronta para a HostGator/Hostinger. Veja [BASE-MYSQL.md](BASE-MYSQL.md). O que está abaixo sobre o Supabase ficou só como alternativa.

Resposta aos itens 1 a 7 da solicitação de melhorias. Resumo: **funciona já em modo local**. O **modo compartilhado** (todos veem a mesma lista) liga quando o Wesley criar a base no Supabase, em cerca de 10 minutos ([BASE-COMPARTILHADA.md](BASE-COMPARTILHADA.md)).

## 1. Análise da estrutura atual
- O protótipo é um site estático (HTML/CSS/JS) publicado no GitHub Pages. **Não tinha servidor nem banco**: tudo ficava no navegador de cada pessoa (localStorage/IndexedDB). Por isso as sugestões de uma pessoa não apareciam para as outras.
- Para compartilhar, era preciso uma **base de dados na nuvem**. Opções avaliadas:

| Opção | Prós | Contras | Decisão |
|---|---|---|---|
| **Supabase** (Postgres) | Já é a base planejada para o sistema real; banco de verdade (SQL); plano grátis; segurança no próprio banco | Precisa criar uma conta (o Wesley) | ✅ **Escolhida** |
| Firebase (Firestore) | O Wesley já usa em outro projeto | Regras de segurança mais difíceis sem login; outro banco para manter | — |
| Google Planilhas | Simples de ver | Lento, frágil com edição simultânea, segurança fraca | — |
| GitHub Issues | Grátis | Exigiria chave secreta no site público (inseguro) | — |

## 2. Base compartilhada: como ficou
- Arquivo **`supabase/schema.sql`**: duas tabelas (`tw_sugestoes`, `tw_testes`) e funções de acesso.
- **Segurança:**
  - As tabelas ficam **fechadas**: ninguém lê ou grava direto.
  - Tudo passa por **funções** que exigem o **código da equipe**, que vai no link do grupo.
  - Mudar situação e excluir exigem o **código do administrador**, que só o Wesley sabe.
  - Os códigos ficam num schema privado, invisível para a internet.
  - A chave do Supabase que vai no site é a "anon public", que é pública por natureza.
- **Regras no próprio banco** (não dá para burlar pelo navegador):
  - só quem cadastrou (ou o admin) edita;
  - sugestão **aprovada fica travada**;
  - reprovar exige explicação;
  - aprovar só quando está "Aguardando aprovação";
  - todo passo grava no **histórico** (quem, quando, de → para, nota).
- **Validado:** o `schema.sql` foi rodado num Postgres 16 embutido simulando o site (papel `anon`), com **31 de 31 verificações ok** (script `supabase/testar-schema.js`).
- **Modo local:** o arquivo `js/equipe.js` repete **as mesmas regras** no navegador. Assim tudo funciona antes de a base existir, e a troca é só colar 2 chaves em `js/config.js`.
- **Atualização entre usuários:** a lista se atualiza sozinha a cada 10 s enquanto está aberta. Não atualiza enquanto a pessoa está digitando, para não apagar o que ela escreve.

## 3. Sugestões (itens 2 a 5 da solicitação)
| Pedido | Como ficou |
|---|---|
| Nome de quem usa | Pedido na 1ª vez e guardado. Aparece em tudo. |
| Nº, solicitante, data, área, descrição, situação, observações | Todos os campos. Nº automático (#001, #002…). |
| Salvamento automático | Rascunho salvo a cada tecla. Edições salvas 1 s depois de parar de digitar ("✓ salvo"). |
| Evitar duplicidade | Ao digitar, aparecem **"Parecidas já cadastradas"**, com o botão **"👍 É a mesma"** (apoio em vez de duplicar). Também conta quando o ponto marcado na tela é o mesmo. |
| Lista compartilhada | Tabela Nº / Solicitante / Sugestão / Situação, com busca, filtro por situação e "Só as minhas". |
| Enviar sugestões | **📤 Enviar minhas sugestões**: as pendentes viram "Enviada", com data, hora e quem enviou. Ficam no histórico. |
| Status | Pendente · Enviada · Em análise · Em desenvolvimento · Realizada · Aguardando aprovação · Aprovada · Reprovada — necessita de ajuste |
| Controle do Wesley | **🔑 Sou o administrador** (código) → muda situação com nota, exclui duplicadas, vê tudo. "Realizada" já libera para o solicitante conferir. |
| Validação e aprovação | Aba **Para aprovar**: botões "👁 Ver este ponto na tela", **Aprovar** e **Pedir ajuste** (com comentário). |
| Após aprovar | Grava quem e quando, move para a aba **✅ Aprovadas**, trava a edição. Nova sugestão no mesmo ponto recebe o aviso 🔒 e fica marcada para o admin autorizar. |
| Marcar na tela | Mantido: grava o rastro (tela › seção › item + filtros) e mostra contorno tracejado nos pontos com sugestão aberta. |

## 4. Testes (item 1 da solicitação)
### 4.1 Teste automático
- Botão **▶️ Iniciar teste automático**: roda **28 testes** (30 com reconhecimento facial), cobrindo site, unidades/Maps, horários e filtros, planos, aula experimental pelo assistente, painel, app do aluno, agendar e cancelar, check-in, Pix com baixa, presença, busca, graduação, mostrar/esconder valores, automações, navegação por todas as telas, central de sugestões, manifesto/ícones e atualização automática.
- **Mostra cada passo** com destaque amarelo no botão que está sendo tocado, e um painel com ✅/❌ ao vivo e o botão **Parar**.
- **Não altera dados:** antes de começar, guarda tudo do aparelho e bloqueia WhatsApp e janelas. No fim devolve exatamente como estava. Conferi: só o relatório novo fica salvo. **Não** cria sugestões nem fotos.
- Gera o **relatório** (salvo na base) com erro, tela e últimos passos de cada falha. Botões para **enviar pelo WhatsApp**, copiar e **💡 Virar sugestões**.
- **Resultado aqui:** 28/28 ok no computador (58 s). No celular, 29/30 com o facial: **achou uma falha real**, o menu do site não rolava até "Horários" em certas situações. Já corrigi e conferi o menu à mão; os 30 testes não foram rodados de novo depois da correção.

### 4.2 Teste manual acompanhado
- **🔴 Iniciar teste** → uma barra vermelha mostra que o teste está em andamento (tempo, telas, ações ok, erros, anotações).
- Registra sozinho: **telas** abertas, **botões** tocados, **ações concluídas** (agendou, pagou Pix, check-in, graduou, presença, foto da turma, sugestões…) e **erros do sistema**, com detalhe técnico (arquivo, linha, pilha).
- **📝 Anotar problema** a qualquer momento, com opção de **marcar na tela** onde foi.
- Continua mesmo se a página recarregar.
- **⏹ Finalizar** gera o relatório com: responsável, data e horário, duração, **funcionalidades usadas**, **processos com sucesso**, **erros** (tela, descrição, informação técnica) e **problemas anotados**. O relatório é salvo e pode ser enviado ou virar sugestões.

### 4.3 Simplicidade e segurança
- Linguagem simples, sem termos técnicos na tela. A parte técnica vai só para o relatório.
- Os testes usam os **dados de demonstração** do protótipo (não há dados reais). O teste automático ainda devolve tudo como estava.
- Erros das ferramentas são registrados e **não travam** o sistema.

## 5. Limitações conhecidas
- Enquanto o Supabase não for configurado, cada pessoa vê **só as próprias** sugestões e relatórios (modo local, aviso 🟡 no topo).
- O nome é **declarado** (não há senha individual). Para 3 ou 4 pessoas de confiança com o código da equipe é suficiente. No sistema real haverá login.
- O teste automático cobre os fluxos principais. Não substitui alguém olhando o visual.
