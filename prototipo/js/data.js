/* Dados do protótipo. Tudo aqui é FICTÍCIO ou "a confirmar" com o professor.
 * Na versão real, isso vem do banco de dados (Supabase) e é editado pelo painel do professor.
 */
window.DB = {
  escola: {
    nome: 'THE WAY',
    subtitulo: 'Escola de Jiu-jitsu brasileiro',
    lema: ['Disciplina', 'Respeito', 'Superação'],
    instagram: 'https://www.instagram.com/thewaybjj/',
    whatsapp: '', // número a confirmar — o agente usará o WhatsApp Business oficial
    cidade: 'Brasília · DF'
  },

  unidades: [
    // "mapa" = texto que o Google Maps procura. Enquanto o endereço não é confirmado, procura pelo nome do local.
    { id: 'hammer', nome: 'Hammer BSB', insta: '@hammerbsb', endereco: 'Endereço a confirmar', mapa: 'Hammer BSB, Brasília - DF', status: 'ativa' },
    { id: 'gladius', nome: 'Gladius Fight Club', insta: '@gladiusfightclub', endereco: 'Endereço a confirmar', mapa: 'Gladius Fight Club, Brasília - DF', status: 'ativa' },
    { id: 'vp', nome: 'Vicente Pires', insta: '@thewaybjj', endereco: 'St. Hab. Vicente Pires, Módulo 27, 2º andar — Taguatinga/DF', mapa: 'Setor Habitacional Vicente Pires Módulo 27, Taguatinga, Brasília - DF', status: 'ativa', nota: 'Endereço que está no Linktree' },
    { id: 'samambaia', nome: 'THE WAY Samambaia', insta: '@thewaybjj', endereco: 'Sede própria — em construção', status: 'em-breve' }
  ],

  // Grade de exemplo, montada a partir do app atual (quarta-feira) e do post "Grade The Way".
  // dia: 1=segunda ... 6=sábado
  grade: [
    { dia: 1, hora: '06:00', turma: 'Intermediário', nivel: 'adulto', unidade: 'hammer' },
    { dia: 1, hora: '16:30', turma: 'Drill / Livre', nivel: 'adulto', unidade: 'hammer' },
    { dia: 1, hora: '19:15', turma: 'Infantil', nivel: 'infantil', unidade: 'hammer' },
    { dia: 1, hora: '20:30', turma: 'Avançado', nivel: 'adulto', unidade: 'hammer' },
    { dia: 2, hora: '06:00', turma: 'No-Gi', nivel: 'adulto', unidade: 'hammer' },
    { dia: 2, hora: '12:00', turma: 'Treino Livre', nivel: 'adulto', unidade: 'gladius' },
    { dia: 2, hora: '19:15', turma: 'Iniciante', nivel: 'adulto', unidade: 'gladius' },
    { dia: 2, hora: '20:30', turma: 'Avançado', nivel: 'adulto', unidade: 'gladius' },
    { dia: 3, hora: '06:00', turma: 'Treino da Madrugada', nivel: 'adulto', unidade: 'hammer' },
    { dia: 3, hora: '12:00', turma: 'Open Mat', nivel: 'adulto', unidade: 'hammer' },
    { dia: 3, hora: '16:30', turma: 'Livre / Drill', nivel: 'adulto', unidade: 'hammer' },
    { dia: 3, hora: '19:15', turma: 'Infantil', nivel: 'infantil', unidade: 'hammer' },
    { dia: 3, hora: '20:30', turma: 'Avançado', nivel: 'adulto', unidade: 'hammer' },
    { dia: 4, hora: '06:00', turma: 'No-Gi', nivel: 'adulto', unidade: 'hammer' },
    { dia: 4, hora: '16:30', turma: 'Treino Livre', nivel: 'adulto', unidade: 'vp' },
    { dia: 4, hora: '19:15', turma: 'Iniciante', nivel: 'adulto', unidade: 'vp' },
    { dia: 4, hora: '20:30', turma: 'Avançado', nivel: 'adulto', unidade: 'vp' },
    { dia: 5, hora: '06:00', turma: 'Intermediário', nivel: 'adulto', unidade: 'hammer' },
    { dia: 5, hora: '12:00', turma: 'Open Mat', nivel: 'adulto', unidade: 'gladius' },
    { dia: 5, hora: '19:15', turma: 'Infantil', nivel: 'infantil', unidade: 'gladius' },
    { dia: 5, hora: '20:30', turma: 'Avançado', nivel: 'adulto', unidade: 'gladius' },
    { dia: 6, hora: '10:00', turma: 'Open Mat', nivel: 'adulto', unidade: 'hammer' }
  ],

  planos: [
    { id: 'adulto', nome: 'Adulto', preco: 150, periodo: '/mês', itens: ['Treinos ilimitados na grade', 'App com agenda, check-in e evolução', 'Pix com baixa automática'], destaque: true },
    { id: 'dependente', nome: 'Filho de aluno', preco: 100, periodo: '/mês por filho', itens: ['Valor especial para filhos de aluno', 'Uma mensalidade só para a família', 'Pais acompanham tudo no app'] },
    { id: 'outros', nome: 'Infantil e outros', preco: null, periodo: '/mês', itens: ['Infantil sem responsável matriculado', 'Aula avulsa / diária', 'Valores a confirmar com o professor'] }
  ],
  // Valores informados: adulto R$ 150 e filho R$ 100 (regra do desconto a confirmar). Outras formas de pagamento: a definir.
  precos: { adulto: 150, dependente: 100 },

  professores: [
    { nome: 'Professor responsável', faixa: 'preta', texto: 'Nome, graduação, linhagem e títulos — a preencher com o professor.' },
    { nome: 'Professor(a) auxiliar', faixa: 'marrom', texto: 'Espaço para a equipe, se houver.' }
  ],

  regras: [
    'Seja pontual',
    'Mantenha seu kimono limpo e sem rasgos (branco, azul ou preto)',
    'Cumprimente o professor e seus companheiros de treino',
    'Não reclame de cansaço, isso só piora…',
    'Não converse durante a aula',
    'Abra a cabeça para aprender',
    'Treine sua deficiência',
    'Não resista ao golpe por vaidade',
    'Se perdeu, tente de novo',
    'Se ganhou, respeite!'
  ],

  faixas: {
    adulto: [
      { id: 'branca', nome: 'Branca', cor: '#F5F5F2', texto: '#111' },
      { id: 'azul', nome: 'Azul', cor: '#1F5BD6', texto: '#fff' },
      { id: 'roxa', nome: 'Roxa', cor: '#6A3FA0', texto: '#fff' },
      { id: 'marrom', nome: 'Marrom', cor: '#6B4428', texto: '#fff' },
      { id: 'preta', nome: 'Preta', cor: '#111', texto: '#fff' }
    ],
    infantil: [
      { id: 'cinza', nome: 'Cinza', cor: '#8A8F96', texto: '#fff' },
      { id: 'amarela', nome: 'Amarela', cor: '#F2C230', texto: '#111' },
      { id: 'laranja', nome: 'Laranja', cor: '#EE7A22', texto: '#111' },
      { id: 'verde', nome: 'Verde', cor: '#2E9150', texto: '#fff' }
    ]
  },

  // Regra de graduação (o professor ajusta no painel). App atual: 22 feitas + 23 faltando = 45 aulas por grau.
  aulasPorGrau: 45,

  // Aluno logado no protótipo
  eu: {
    nome: 'Aluno Demonstração',
    apelido: 'Aluno',
    faixa: 'branca', grau: 1, aulasNoGrau: 22,
    unidade: 'hammer',
    desde: '2026-03-17',
    dependentes: [{ nome: 'Filho(a) Demonstração', faixa: 'cinza', grau: 2 }],
    composicao: [['Você — plano Adulto', 150], ['Filho(a) Demonstração — filho de aluno', 100]]
  },

  historicoGraduacoes: [
    { data: '2026-03-17', titulo: 'Início na The Way', texto: 'Primeira aula — bem-vindo ao tatame!', faixa: 'branca', grau: 0 },
    { data: '2026-06-17', titulo: '1º grau na faixa branca', texto: 'Entregue pelo professor após 45 aulas.', faixa: 'branca', grau: 1 }
  ],

  pagamentos: [
    { ref: 'Abr/2026', venc: '2026-04-10', valor: 250, pago: '2026-04-20', via: 'Pix' },
    { ref: 'Mai/2026', venc: '2026-05-10', valor: 250, pago: '2026-05-13', via: 'Pix' },
    { ref: 'Jun/2026', venc: '2026-06-10', valor: 250, pago: '2026-06-18', via: 'Pix' },
    { ref: 'Jul/2026', venc: '2026-07-10', valor: 250, pago: '2026-07-15', via: 'Pix' },
    { ref: 'Ago/2026', venc: '2026-08-10', valor: 250, pago: '2026-08-10', via: 'Pix' },
    { ref: 'Set/2026', venc: '2026-09-10', valor: 250, pago: '2026-09-18', via: 'Pix' },
    { ref: 'Out/2026', venc: '2026-10-10', valor: 250, pago: '2026-10-09', via: 'Pix' },
    { ref: 'Nov/2026', venc: '2026-11-10', valor: 250, pago: null, via: null },
    { ref: 'Dez/2026', venc: '2026-12-10', valor: 250, pago: null, via: null }
  ],

  // Alunos fictícios para o painel do professor
  alunos: [
    ['Ana Beatriz Souza', 'azul', 2, 41, 'em-dia', 'hammer'],
    ['Bruno Henrique Lima', 'branca', 4, 44, 'em-dia', 'hammer'],
    ['Carlos Eduardo Reis', 'roxa', 1, 12, 'atrasado', 'gladius'],
    ['Daniela Ferreira', 'branca', 2, 30, 'em-dia', 'vp'],
    ['Eduardo Matos', 'azul', 0, 8, 'em-dia', 'hammer'],
    ['Fernanda Rocha', 'branca', 3, 45, 'em-dia', 'gladius'],
    ['Gabriel Nunes', 'branca', 0, 5, 'experimental', 'hammer'],
    ['Helena Castro', 'marrom', 2, 20, 'em-dia', 'hammer'],
    ['Igor Almeida', 'azul', 3, 39, 'atrasado', 'vp'],
    ['João Pedro Silva', 'branca', 1, 22, 'em-dia', 'hammer'],
    ['Larissa Monteiro', 'branca', 4, 46, 'em-dia', 'gladius'],
    ['Marcos Vinícius', 'preta', 1, 3, 'em-dia', 'hammer'],
    ['Natália Gomes', 'branca', 0, 14, 'em-dia', 'vp'],
    ['Otávio Ribeiro', 'azul', 1, 27, 'em-dia', 'gladius'],
    ['Paula Cristina', 'roxa', 3, 33, 'em-dia', 'hammer'],
    ['Rafael Teixeira', 'branca', 2, 18, 'atrasado', 'hammer']
  ].map(([nome, faixa, grau, aulas, status, unidade], i) => ({ id: i + 1, nome, faixa, grau, aulas, status, unidade })),

  experimentais: [
    { nome: 'Lucas Martins', idade: 'Adulto', quando: 'Qua 20:30 · Hammer BSB', origem: 'Site', status: 'confirmado' },
    { nome: 'Sofia (8 anos) — resp. Juliana', idade: 'Infantil', quando: 'Sex 19:15 · Gladius', origem: 'WhatsApp (agente)', status: 'lembrete enviado' },
    { nome: 'Thiago Pereira', idade: 'Adulto', quando: 'Ter 19:15 · Gladius', origem: 'Instagram (agente)', status: 'compareceu' }
  ],

  automacoes: [
    { id: 'exp', nome: 'Aula experimental automática', desc: 'Interessado agenda pelo site ou conversando com o agente no WhatsApp/Instagram. Recebe confirmação, endereço e o que levar.', on: true, canal: 'WhatsApp + Site' },
    { id: 'lemb', nome: 'Lembrete de aula', desc: '2 horas antes da aula agendada, com botão “vou” / “não vou” (libera a vaga).', on: true, canal: 'Push + WhatsApp' },
    { id: 'pos-exp', nome: 'Pós-aula experimental', desc: 'No dia seguinte: “Como foi o treino?” + planos + link para matrícula.', on: true, canal: 'WhatsApp' },
    { id: 'cobranca', nome: 'Cobrança da mensalidade', desc: '3 dias antes do vencimento envia o Pix. Baixa automática quando pagar. Lembrete gentil se atrasar.', on: true, canal: 'WhatsApp + App' },
    { id: 'sumido', nome: 'Aluno sumido', desc: 'Sem treinar há 10 dias → mensagem de incentivo. Avisa o professor se passar de 21 dias.', on: true, canal: 'WhatsApp' },
    { id: 'graduar', nome: 'Pronto para graduar', desc: 'Quando o aluno completa as aulas do grau, avisa o professor no painel.', on: true, canal: 'Painel' },
    { id: 'aniv', nome: 'Aniversário', desc: 'Mensagem de parabéns da equipe The Way.', on: false, canal: 'WhatsApp' },
    { id: 'foto', nome: 'Foto da turma', desc: 'Professor envia a foto no app → vai para a galeria e para quem treinou (substitui o grupo como comprovante).', on: true, canal: 'App' }
  ]
};
