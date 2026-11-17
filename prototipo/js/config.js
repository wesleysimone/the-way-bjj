/* Configuração da base compartilhada das sugestões e relatórios de teste.
 *
 * Enquanto estiver vazio, funciona em MODO LOCAL (cada aparelho guarda só o seu).
 *
 * Opção escolhida (sem mensalidade extra): API própria em PHP + MySQL — pasta servidor/
 *   • no seu computador:  apiUrl: 'http://localhost:8080/api.php'
 *   • na hospedagem:      apiUrl: 'https://seudominio.com.br/api/api.php'
 *   Passo a passo: documentacao/BASE-MYSQL.md
 *
 * (Alternativa antiga, não usada: Supabase — documentacao/BASE-COMPARTILHADA.md)
 */
window.THEWAY_CONFIG = {
  apiUrl: '',             // ex.: 'https://seudominio.com.br/api/api.php'
  supabaseUrl: '',
  supabaseAnonKey: ''
};
