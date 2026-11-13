# Presença por reconhecimento facial

## O problema hoje
O aluno agenda no app → no fim da aula o professor tira **foto da turma** e manda no grupo → alguém confere a foto e dá baixa na presença **à mão** (no BJJ Control fica tudo “Pendente”).

## Como fica
1. **Cadastro (uma vez):** no app, *Perfil › Reconhecimento facial*, o aluno tira 3 fotos: **de frente, virado para um lado e para o outro**. O app confere se há um rosto e se a pose está certa. Pais cadastram os filhos pelo mesmo app, em *Dependentes*.
2. **Fim da aula:** o professor toca em **Painel › Hoje › “Foto da turma → presença automática”** e tira a foto, a mesma que já tira hoje.
3. O sistema **acha todos os rostos**, compara com os cadastrados e mostra quem reconheceu, em verde com o nome, e quem não reconheceu, em amarelo.
4. Para rosto não reconhecido, o professor escolhe **quem é** na lista. O sistema **aprende** e reconhece essa pessoa nas próximas fotos.
5. Ele toca em **Confirmar presença**: as aulas contam para a graduação e a foto vai para a galeria.

O QR code e o “marcar com um toque” continuam como alternativa: quando alguém sai da foto, de costas, de lado demais etc.

## A foto manda, não o agendamento (v0.3.0)
Muitos alunos **não agendam e vão**, e outros **agendam e não vão**. Por isso a presença vem da **foto**:

| Situação | O que o sistema faz |
|---|---|
| Agendou e está na foto | ✅ Presença |
| **Não agendou** e está na foto | ✅ Presença, com o aviso “veio sem agendar” |
| Agendou e **não** está na foto | ⚠️ Falta. O professor pode marcar “estava” (saiu da foto). O agente manda “sentimos sua falta”. |
| Rosto que o sistema não conhece | ❓ O professor escolhe quem é (aluno / **Professor** / **Visitante-experimental**). O sistema aprende o rosto, menos o de visitante. |
| Professor na foto | Reconhecido como Professor e **não conta presença** |

### Como a foto chega ao sistema
1. **Tirar agora**, pelo painel (abre a câmera).
2. **Galeria / WhatsApp**: escolher a foto que já está no celular, inclusive a enviada no grupo.
3. **Compartilhar direto do WhatsApp** (Android, com o app instalado): na foto, toque em Compartilhar › **The Way** e o app já abre o reconhecimento. *(No iPhone essa opção não existe para PWA; usa-se a opção 2.)*
4. *(Futuro, com o agente)* O professor manda a foto para o **número do WhatsApp da escola** e o agente processa e responde com o resumo (“22 presenças, 2 faltas, 1 rosto desconhecido: quem é?”). A API oficial do WhatsApp trabalha com conversas diretas com o número da escola; ler fotos de **grupo** precisa ser confirmado na implementação.

## Teste com a foto real da aula (13/11/2026)
Foto enviada pelo WhatsApp: **960×1280 px**, **24 pessoas** em 3 fileiras, rostos de ~25 a 35 px.

| Método | Rostos achados |
|---|---|
| Foto inteira de uma vez (v0.2.0) | 26, com **2 duplicados**, 1 pessoa perdida e 1 falso de baixa confiança |
| **Foto em pedaços sobrepostos (v0.3.0)** | **24 de 24**, sem duplicados (~0,5 s) |

- Fluxo testado no painel: ensinei 9 rostos (7 alunos, 1 professor, 1 visitante) e confirmei. Na 2ª leitura da mesma foto, reconheceu **os 8** (o visitante não é memorizado, de propósito). O resultado separou: 7 presenças (1 “veio sem agendar”), o professor e 3 faltas de quem agendou e não apareceu.
- **Ainda não medido:** acerto entre **fotos diferentes** (outra aula, outra luz). Para isso é preciso que os alunos cadastrem o rosto, ou ter 2 ou 3 fotos de aulas diferentes.

### Recomendações para a foto
- Enviar em **HD** no WhatsApp (a foto normal é comprimida para 960 px e os rostos ficam pequenos). Melhor ainda: enviar pela opção de compartilhar para o app, ou pela galeria do próprio celular.
- Todos de frente, sem boné, em 2 ou 3 fileiras (como na foto de teste, que ficou ótima).
- Fotógrafo um pouco mais perto: a parte de cima da foto (teto) pode ficar de fora.

## O que já funciona no protótipo
- Detecção e reconhecimento **de verdade**, rodando no navegador. A biblioteca é `@vladmandic/face-api`, com TensorFlow.js.
- Cadastro em 3 poses, com verificação de pose. Se não houver câmera, aceita enviar uma foto.
- Aprendizado com rostos desconhecidos na foto da turma.
- **Limitação do protótipo:** os rostos ficam salvos **no aparelho em que foram cadastrados**. Para testar o fluxo completo, cadastre e tire a foto da turma no mesmo celular. No sistema real, isso fica no banco de dados.
- Na 1ª vez, baixa uns 13 MB de modelos (depois ficam em cache).

## Sistema real: decisões técnicas
| Tema | Proposta |
|---|---|
| Onde roda | Celular do professor (no navegador, sem custo por foto) **ou** no servidor. Começar no navegador: é grátis e a foto não sai do aparelho. |
| O que guardar | Só a **assinatura do rosto** (128 números por foto), **não** a foto do cadastro. |
| Precisão | Cadastro com 3 poses + aprendizado a cada aula confirmada. Se ficar abaixo do esperado em fotos de grupo grandes (rostos pequenos/de lado), avaliar um serviço pago (AWS Rekognition / Azure Face) ou um modelo mais forte no servidor. |
| Foto ruim | Pedir ao professor 2 fotos (uma mais perto) ou foto em duas fileiras, todos olhando para a câmera. |
| Sem cadastro | O aluno continua podendo usar QR/presença manual. O reconhecimento é **opcional**. |

## LGPD: obrigatório
Biometria facial é **dado pessoal sensível** (LGPD, art. 11). Por isso:
- **Consentimento específico e destacado** para isso (já está no protótipo: caixa de autorização antes de abrir a câmera).
- **Menores:** consentimento de **pai/mãe ou responsável** (art. 14).
- Finalidade única: **registrar presença**. Não usar para outra coisa.
- O aluno pode **apagar** o cadastro do rosto a qualquer momento (botão “Apagar” no perfil).
- Política de privacidade no site explicando isso.
- Fotos da turma na galeria: avisar no cadastro e permitir que o aluno peça para não aparecer.

## Pendente
- [x] Foto real de fim de aula avaliada (24/24 rostos detectados).
- [ ] Medir acerto entre aulas diferentes. Precisa de 2 ou 3 fotos de dias diferentes, ou de alunos com rosto cadastrado. Ajustar `LIMIAR` em `prototipo/js/rosto.js` (hoje 0.5).
- [ ] A foto de teste **não** vai para o GitHub (`prototipo/_teste/` está no `.gitignore`), porque tem rostos de pessoas reais.
