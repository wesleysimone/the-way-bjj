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

## O que já funciona no protótipo (v0.2.0)
- Detecção e reconhecimento **de verdade**, rodando no navegador. A biblioteca é `@vladmandic/face-api`, com TensorFlow.js.
  Testei com uma foto de grupo: achou os 3 rostos. Depois de ensinar uma vez, reconheceu os 3.
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
- [ ] Wesley vai mandar uma foto real de fim de aula para avaliar: quantas pessoas, distância, luz. Com ela dá para testar a taxa de acerto e ajustar o limite de semelhança (`LIMIAR` em `prototipo/js/rosto.js`, hoje 0.5).
